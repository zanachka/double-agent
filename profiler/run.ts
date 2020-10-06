import 'source-map-support/register';
import * as Path from 'path';
import * as Fs from 'fs';
import IAssignment from '@double-agent/runner/interfaces/IAssignment';
import Queue from 'p-queue';
import fetch from 'node-fetch';
import unzipper from 'unzipper';
import BrowserStack from './lib/BrowserStack';
import runAssignmentInWebDriver from './lib/runAssignmentInWebDriver';
import IBrowserstackAgent from './interfaces/IBrowserstackAgent';
import { WebDriver } from 'selenium-webdriver';
import Profiler from './index';
import UserAgentsToTest from './lib/UserAgentsToTest';
import { createUseragentIdFromKeys } from './index';
import RealUserAgents from "@double-agent/real-user-agents";

const EXPECTED_FILE_COUNT = 9;

const runnerDomain = 'da-collect.ulixee.org';
const runnerPort = 3000;
const drivers: WebDriver[] = [];

process.on('exit', () => {
  drivers.forEach(x => x.quit());
});

(async () => {
  let totalCount = 0;
  const queue = new Queue({ concurrency: 5 });

  for (const userAgentToTest of UserAgentsToTest.all()) {
    const browser = RealUserAgents.getBrowser(userAgentToTest.browserId);
    const operatingSystem = RealUserAgents.getOperatingSystem(userAgentToTest.operatingSystemId);

    if (browser.name === 'IE' || (browser.name === 'Chrome' && Number(browser.version.major) < 58)) {
      // no support for Promises, lambdas... detections need refactor for support
      console.log("DoubleAgent doesn't support", browser.id);
      continue;
    }

    const useragentId = createUseragentIdFromKeys(operatingSystem.id, browser.id);
    if (Profiler.useragentIds.includes(useragentId)) {
      const filesDir = extractFilesDir(useragentId);
      const filesCount = Fs.readdirSync(filesDir).length;
      if (filesCount === EXPECTED_FILE_COUNT) {
        console.log('Profile exists', useragentId);
        continue;
      } else {
        console.log('Profile exists but is missing files... rerunning', useragentId);
        Fs.rmdirSync(filesDir, { recursive: true });
      }
    }

    const browserStackAgent = await BrowserStack.createAgent(operatingSystem, browser);
    if (!browserStackAgent) {
      console.log("BrowserStack doesn't support", browser.id, operatingSystem.id);
      continue;
    }

    queue.add(getRunnerForAgent(browserStackAgent, useragentId));
    totalCount += 1;
  }

  await queue.onIdle();

  console.log(''.padEnd(100, '-'));
  console.log(`${totalCount} browser profiles`);
  console.log(''.padEnd(100, '-'));
})();

function getRunnerForAgent(agent: IBrowserstackAgent, useragentId: string) {
  return async function runnerForAgent() {
    const scraperName = useragentId;
    const { assignment } = await assignmentServer<IAssignment>('/', {
      scraperName,
      dataDir: 'download',
    });
    console.log('Running agent [%s]', agent);

    const driver = await BrowserStack.buildWebDriver(agent);
    drivers.push(driver);
    try {
      await runAssignmentInWebDriver(driver, assignment, agent.browser, agent.browser_version);
    } catch (error) {
      console.log(error);
    } finally {
      const idx = drivers.indexOf(driver);
      if (idx >= 0) drivers.splice(idx, 1);
      await driver.quit();
    }

    console.log(`DOWNLOADING ${scraperName}`);
    const filesStream = await assignmentServer<any>(`/download/${assignment.id}`, { scraperName });
    const filesDir = extractFilesDir(useragentId);
    if (!Fs.existsSync(filesDir)) Fs.mkdirSync(filesDir, { recursive: true });

    console.log(`DOWNLOADING ${scraperName}`);
    return new Promise(resolve => {
      filesStream.pipe(unzipper.Extract({ path: filesDir }));
      filesStream.on('finish', () => {
        console.log(`FINISHED DOWNLOADING ${scraperName}`);
        resolve();
      });
    });
  }
}

function extractFilesDir(useragentId: string) {
  const matches = useragentId.match(/^(.+)-([0-9+])$/).slice(1);
  const [useragentIdWithoutMinor, minorVersion] = matches;
  return Path.resolve(__dirname, `data/profiles/${useragentIdWithoutMinor}/${minorVersion}`);
}

async function assignmentServer<T = any>(path: string, params: { scraperName: string, dataDir?: string }) {
  const paramStrs = [`scraper=${params.scraperName}`];
  if (params.dataDir) paramStrs.push(`dataDir=${params.dataDir}`);

  const res = await fetch(`http://${runnerDomain}:${runnerPort}${path}?${paramStrs.join('&')}`);
  const contentType = res.headers.get('content-type');

  if (contentType === 'application/json') {
    const data = await res.json();
    if (res.status >= 400) {
      throw new Error(data.message)
    }
    return data;
  }

  return res.body;
}
