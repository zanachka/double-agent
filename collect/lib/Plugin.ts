import * as Path from 'path';
import IPlugin from "../interfaces/IPlugin";
import IRequestContext from "../interfaces/IRequestContext";
import {IServerProtocol} from "../servers/BaseServer";
import TlsServer from "../servers/TlsServer";
import HttpServer from "../servers/HttpServer";
import HttpsServer from "../servers/HttpsServer";
import IServerContext from "../interfaces/IServerContext";
import {URL} from "url";
import {MainDomain, TlsDomain} from "../index";
import ISessionPage from "../interfaces/ISessionPage";
import {addPageIndexToUrl, addSessionIdToUrl} from "./DomainUtils";
import Document from "./Document";
import EventEmitter from 'events';
import {AssignmentType} from "@double-agent/runner/interfaces/IAssignment";
import Session from "./Session";

type IHandler = (ctx: IRequestContext) => Promise<void> | void;
type IFlexibleServerProtocol = IServerProtocol | 'all';

interface IRoute {
  protocol: IServerProtocol;
  path: string;
  handler: IHandler;
}

export interface IRoutesByPath {
  [path: string]: IRoute;
}

export interface IPluginPage {
  route: IRoute;
  domain?: string;
  clickNext?: boolean;
  waitForReady?: boolean;
  isRedirect?: boolean;
  name?: string;
  data?: any;
}

const releasedPorts: number[] = [];
let portCounter = Number(process.env.STARTING_PORT ?? 3001);

interface IPagesByAssignmentType {
  [AssignmentType.Individual]: IPluginPage[];
  [AssignmentType.OverTime]: IPluginPage[];
}

export default abstract class Plugin extends EventEmitter implements IPlugin {
  public id: string;
  public dir: string;
  public summary: string;
  public pagesByAssignmentType: IPagesByAssignmentType = {
    [AssignmentType.Individual]: [],
    [AssignmentType.OverTime]: [],
  };

  protected routes: { [protocol: string]: { [path: string]: IRoute } } = {};

  protected httpServer: HttpServer;
  protected httpsServer: HttpsServer;
  protected tlsServerBySessionId: { [sessionId: string]: TlsServer } = {};

  constructor(pluginDir: string) {
    super();
    this.dir = pluginDir;
    this.id = Path.basename(pluginDir);
    const packageJson = require(`${pluginDir}/package.json`);
    if (packageJson) {
      this.summary = packageJson.description;
    }
    this.initialize();
  }

  abstract initialize(): void;

  public pagesForSession(session: Session): ISessionPage[] {
    return this.pagesByAssignmentType[session.assignmentType].map((page: IPluginPage, pageIndex: number) => {
      return this.convertToSessionPage(page, session.id, pageIndex);
    });
  }

  public convertToSessionPage(page: IPluginPage, sessionId: string, pageIndex: number) {
    const { protocol, path } = page.route;
    const domain = page.domain || (protocol === 'tls' ? TlsDomain : MainDomain);
    const server = this.getServer(protocol, sessionId);
    const baseUrl = `${protocol === 'tls' ? 'https' : protocol}://${domain}:${server.port}`;
    const fullPath = `/${this.id}${path.startsWith('/') ? path : `/${path}`}`;

    let url = new URL(fullPath, baseUrl).href;
    url = addSessionIdToUrl(url, sessionId);
    url = addPageIndexToUrl(url, pageIndex);

    const sessionPage: ISessionPage = {url};
    if (page.waitForReady || page.clickNext) {
      sessionPage.waitForElementSelector = Document.waitForElementSelector;
    }

    if (page.isRedirect) {
      sessionPage.isRedirect = page.isRedirect;
    }

    if (page.clickNext) {
      sessionPage.clickElementSelector = Document.clickElementSelector;
    }

    return sessionPage;
  }

  public async createServersForSession(session: Session) {
    if (!this.pagesByAssignmentType[session.assignmentType].length) return;
    const  { sessionTracker, pluginDelegate } = session;
    const serverContext = { sessionTracker, pluginDelegate, plugin: this };
    for (const [protocol, routesByPath] of Object.entries(this.routes)) {
      await this.createServer(protocol as IServerProtocol, serverContext, session.id, routesByPath);
    }
  }

  public onServerStart(protocol: IServerProtocol, callback: () => void) {
    this.once(`${protocol}-started`, callback);
  }


  public onServerStop(protocol: IServerProtocol, callback: () => void) {
    this.once(`${protocol}-stopped`, callback);
  }

  public async closeServersForSession(sessionId: string) {
    if (!this.tlsServerBySessionId[sessionId]) return;
    await this.tlsServerBySessionId[sessionId].stop();
    releasedPorts.push(this.tlsServerBySessionId[sessionId].port);
  }

  public getServer(protocol, sessionId: string) {
    if (protocol === 'tls') {
      return this.tlsServerBySessionId[sessionId];
    } else if (protocol === 'http') {
      return this.httpServer;
    } else if (protocol === 'https') {
      return this.httpsServer;
    }
  }

  private async createServer(
      protocol: IServerProtocol,
      serverContext: IServerContext,
      sessionId: string,
      routesByPath: IRoutesByPath,
  ) {
    const port = generatePort();
    if (protocol === 'tls') {
      this.tlsServerBySessionId[sessionId] = await new TlsServer(port, routesByPath).start(serverContext);
      console.log(`${this.id} listening on ${port} (TLS)`);
    } else if (protocol === 'http') {
      if (this.httpServer) return;
      this.httpServer = await new HttpServer(port, routesByPath).start(serverContext);
      console.log(`${this.id} listening on ${port} (HTTP)`);
    } else if (protocol === 'https') {
      if (this.httpsServer) return;
      this.httpsServer = await new HttpsServer(port, routesByPath).start(serverContext);
      console.log(`${this.id} listening on ${port} (HTTPS)`);
    }
    this.emit(`${protocol}-started`);
  }

  protected registerRoute(protocol: IFlexibleServerProtocol, path: string, handler: IHandler) {
    if (protocol === 'all') {
      this.registerRoute('http', path, handler);
      this.registerRoute('https', path, handler);
      return;
    }
    this.routes[protocol] = this.routes[protocol] || {};
    if (this.routes[protocol][path]) {
      throw new Error(`Path already exists: ${protocol}:${path}`);
    }
    this.routes[protocol][path] = { protocol: protocol, path, handler: handler.bind(this) };
  }

  protected registerPages(...pages: IPluginPage[]) {
    this.pagesByAssignmentType[AssignmentType.Individual] = pages;
  }

  protected registerPagesOverTime(...pages: IPluginPage[]) {
    this.pagesByAssignmentType[AssignmentType.OverTime] = pages;
  }
}

function generatePort() {
  if (releasedPorts.length) {
    return releasedPorts.shift();
  }
  return portCounter += 1;
}
