import 'source-map-support/register';
import * as Path from 'path';
import IAssignment from '@double-agent/runner/interfaces/IAssignment';
import Queue from 'p-queue';
import fetch from 'node-fetch';
import BrowserStack from './lib/BrowserStack';
import runAssignmentInWebDriver from './lib/runAssignmentInWebDriver';
import IBrowserstackAgent from './interfaces/IBrowserstackAgent';
import { WebDriver } from 'selenium-webdriver';
import ProfilerData from './data';
import Browsers from './lib/Browsers';
import Oses from './lib/Oses';
import unzipper from 'unzipper';
import { getProfileDirName } from './index';

const runnerDomain = 'da-collect.ulixee.org';
const runnerPort = 3000;

const drivers: WebDriver[] = [];

process.on('exit', () => {
  drivers.forEach(x => x.quit());
});

(async () => {
  let count = 0;
  const browsers = new Browsers();
  const oses = new Oses();
  const queue = new Queue({ concurrency: 5 });
  for (const browser of browsers.toArray()) {
    if (browser.name === 'IE' || (browser.name === 'Chrome' && Number(browser.version.major) < 58)) {
      // no support for Promises, lambdas... detections need refactor for support
      console.log("DoubleAgent doesn't support", browser.key);
      continue;
    }
    for (const browserOs of Object.values(browser.byOsKey)) {
      if (!browserOs.hasBrowserStackSupport) {
        console.log("BrowserStack doesn't support", browser.key, browserOs.key);
        continue;
      }

      const os = oses.getByKey(browserOs.key);
      const profileDirName = getProfileDirName(os, browser);
      count += 1;

      if (ProfilerData.profileDirNames.includes(profileDirName)) {
        console.log('Profile exists', profileDirName);
        continue;
      }

      const browserStackAgent = BrowserStack.createAgent(browser, os);
      queue.add(getRunnerForAgent(browserStackAgent, profileDirName));
    }
  }
  await queue.onIdle();

  console.log(''.padEnd(100, '-'));
  console.log(`${count} browser profiles`);
  console.log(''.padEnd(100, '-'));
})();

function getRunnerForAgent(agent: IBrowserstackAgent, profileDirName: string) {
  return async function runnerForAgent() {
    const scraperName = profileDirName;
    const { assignment } = await assignmentServer<IAssignment>('/', {
      scraperName,
      dataDir: 'download',
    });
    console.log('Running agent [%s]', agent);

    const driver = await BrowserStack.buildWebDriver(agent);
    drivers.push(driver);
    try {
      await runAssignmentInWebDriver(driver, assignment, agent.browserName, agent.browser_version);
    } catch (error) {
      console.log(error);
    } finally {
      const idx = drivers.indexOf(driver);
      if (idx >= 0) drivers.splice(idx, 1);
      await driver.quit();
    }

    console.log(`DOWNLOADING ${scraperName}`);
    const filesStream = await assignmentServer<any>(`/download/${assignment.id}`, { scraperName });
    const filesDir = Path.resolve(__dirname, `data/profiles/${profileDirName}`);
    filesStream.pipe(unzipper.Extract({ path: filesDir }));
    console.log(`FINISHING DOWNLOADING ${scraperName}`);
  }
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
