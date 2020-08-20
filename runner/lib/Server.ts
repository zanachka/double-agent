import url from 'url';
import archiver from 'archiver';
import * as Fs from 'fs';
import * as http from 'http';
import Collect from '@double-agent/collect';
import getAllAssignments, { buildAssignment } from '../lib/getAllAssignments';
import IAssignment from '../interfaces/IAssignment';
import BrowsersToTest from '@double-agent/profiler/lib/BrowsersToTest';
import { pathToRegexp } from 'path-to-regexp';
import Plugin from "@double-agent/collect/lib/Plugin";

interface IRequestParams {
  scraperName: string;
  assignmentId?: string;
  dataDir?: string;
}

interface IActiveScraper {
  name: string;
  assignments: IAssignment[];
  dataDir?: string;
  isBasic?: boolean;
}

const downloadDir = '/tmp/double-agent-download-data';
Fs.rmdirSync(downloadDir, { recursive: true });

export default class Server {
  private browsersToTest = new BrowsersToTest();
  private activeScrapers: { [scraper: string]: IActiveScraper  } = {};
  private readonly collect: Collect
  private readonly httpServer: http.Server;
  private readonly httpServerPort: number;
  private readonly routeMetaByRegexp: Map<RegExp, any> = new Map();

  private readonly endpointsByRoute = {
    '/': this.createBasicAssignment.bind(this),
    '/create': this.createAssignments.bind(this),
    '/activate/:assignmentId': this.activateAssignment.bind(this),
    '/download/:assignmentId': this.downloadAssignmentResults.bind(this),
    '/finish': this.finishAssignments.bind(this),
  };

  constructor(collect: Collect, httpServerPort: number) {
    this.collect = collect;
    this.httpServerPort = httpServerPort;
    this.httpServer = new http.Server(this.handleRequest.bind(this));

    Object.keys(this.endpointsByRoute).forEach(route => {
      const keys = [];
      const regexp = pathToRegexp(route, keys);
      this.routeMetaByRegexp.set(regexp, { route, keys });
    });
  }

  public start() {
    return new Promise(resolve => {
      this.httpServer.listen(this.httpServerPort, resolve).on('error', err => console.log(err));
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const requestUrl = url.parse(req.url, true);

    console.log('Assignment %s', `${req.headers.host}${req.url}`);

    let endpoint;
    const params = {};
    for (const [regexp, meta] of this.routeMetaByRegexp.entries()) {
      const matches = requestUrl.pathname.match(regexp);
      if (matches) {
        endpoint = this.endpointsByRoute[meta.route];
        meta.keys.forEach((key, index) => {
          params[key.name] = matches[index+1];
        });
        break;
      }
    }

    if (!endpoint) {
      return sendJson(res, { message: 'Not Found' }, 404);
    }

    const scraperName = req.headers.scraper ?? requestUrl.query.scraper as string;
    const dataDir = req.headers.dataDir ?? requestUrl.query.dataDir;
    Object.assign(params, { scraperName, dataDir }, params);
    if (!scraperName) return sendJson(res, { message: 'Please provide a scraper header or query param' }, 500);

    await endpoint(req, res, params);
  }

  public async createBasicAssignment(_, res: http.ServerResponse, params: IRequestParams) {
    const { scraperName, dataDir } = params;
    if (!this.activeScrapers[scraperName]) {
      this.activeScrapers[scraperName] = { name: scraperName, dataDir, assignments: [], isBasic: true };
    }

    const activeScraper = this.activeScrapers[scraperName];

    for (const assignment of activeScraper.assignments) {
      const session = this.collect.getSession(assignment.sessionId);
      await this.collect.deleteSession(session);
    }

    const assignment = await buildAssignment(0);
    assignment.profileDirName = scraperName;
    activeScraper.assignments = [assignment];

    params.assignmentId = assignment.id.toString();
    await this.activateAssignment(_, res, params);
  }

  public async createAssignments(_, res: http.ServerResponse, params: IRequestParams) {
    const { scraperName, dataDir } = params;

    this.activeScrapers[scraperName] = this.activeScrapers[scraperName] || await this.createScraper(scraperName, dataDir);

    const assignments = this.activeScrapers[scraperName].assignments.map(assignment => {
      return Object.assign({}, assignment, { pages: undefined });
    });

    sendJson(res, { assignments });
  }

  private async createScraper(name: string, dataDir: string) {
    const assignments = await getAllAssignments(this.browsersToTest);
    return { name, dataDir, assignments };
  }

  public async activateAssignment(_, res: http.ServerResponse, params: IRequestParams) {
    const { scraperName, assignmentId } = params;
    if (!scraperName) return sendJson(res, { message: 'Please provide a scraperName header or query param' }, 500);
    if (!assignmentId) return sendJson(res, { message: 'Please provide a assignmentId header or query param' }, 500);

    const activeScraper = this.activeScrapers[scraperName];
    const assignments = activeScraper?.assignments;
    const assignment = assignments ? assignments[assignmentId] : null;
    if (!assignment) return sendJson(res, { message: 'Assignment not found' }, 500);

    if (assignment.sessionId) return;
    const session = await this.collect.createSession(assignment.useragent || 'freeform');
    assignment.sessionId = session.id;
    assignment.pagesByPlugin = session.pages;

    if (activeScraper.dataDir) {
      session.onSavePluginProfile = (plugin: Plugin, data: any) => {
        const profilesDirPath = createProfilesDirPath(activeScraper, assignment);
        this.saveFile(profilesDirPath, `${plugin.id}.json`, data);
      }
    }

    sendJson(res, { assignment });
  }

  public async downloadAssignmentResults(_, res: http.ServerResponse, params: IRequestParams) {
    const { scraperName, assignmentId } = params;
    if (!scraperName) return sendJson(res, { message: 'Please provide a scraperName header or query param' }, 500);
    if (!assignmentId) return sendJson(res, { message: 'Please provide a assignmentId header or query param' }, 500);

    const activeScraper = this.activeScrapers[scraperName];
    const assignments = activeScraper?.assignments;
    const assignment = assignments ? assignments[assignmentId] : null;
    if (!assignment) return sendJson(res, { message: 'Assignment not found' }, 500);

    const profilesDirPath = createProfilesDirPath(activeScraper, assignment);
    pipeDirToStream(profilesDirPath, res);

    if (activeScraper.isBasic) {
      for (const assignment of assignments) {
        const session = this.collect.getSession(assignment.sessionId);
        await this.collect.deleteSession(session);
      }
      delete this.activeScrapers[scraperName];
      Fs.rmdirSync(profilesDirPath, { recursive: true });
    }
  }

  public async finishAssignments(_, res: http.ServerResponse, params: IRequestParams) {
    const { scraperName } = params;
    const activeScraper = this.activeScrapers[scraperName];
    const assignments = activeScraper ? activeScraper.assignments : null;
    if (!assignments) {
      return sendJson(res, { message: `No assignments were found for ${scraperName}` }, 500);
    }

    for (const assignment of assignments) {
      const session = this.collect.getSession(assignment.sessionId);
      const dirPath = `${activeScraper.dataDir}/${assignment.profileDirName}`;

      this.saveFile(dirPath, 'assignment.json', assignment);
      this.saveFile(dirPath, 'session.json', session.toJSON());
      await this.collect.deleteSession(session);
    }
    delete this.activeScrapers[scraperName];

    sendJson(res, { finished: true });
  }

  private saveFile(dirPath: string, fileName: string, data: any) {
    if (!Fs.existsSync(dirPath)) {
      Fs.mkdirSync(dirPath, { recursive: true });
    }
    Fs.writeFileSync(`${dirPath}/${fileName}`, JSON.stringify(data, null, 2));
    console.log(`SAVED ${dirPath}/${fileName}`);
  }
}

function sendJson(res: http.ServerResponse, json: any, status = 200) {
  res.writeHead(status, {
    'content-type': 'application/json',
  });
  res.end(JSON.stringify(json));
}

function createProfilesDirPath(activeScraper: IActiveScraper, assignment: IAssignment) {
  const profileDirName = assignment.profileDirName || activeScraper.name;
  if (activeScraper.dataDir === 'download') {
    return `${downloadDir}/${profileDirName}`;
  } else {
    return `${activeScraper.dataDir}/${profileDirName}/plugins`;
  }
}

function pipeDirToStream(dirPath: string, stream: any) {
  const archive = archiver('zip', { gzip: true, zlib: { level: 9 } });
  const fileNames = Fs.readdirSync(dirPath);
  for (const fileName of fileNames) {
    const filePath = `${dirPath}/${fileName}`;
    archive.append(Fs.createReadStream(filePath), { name: fileName });
  }
  archive.pipe(stream);
  archive.finalize();
}
