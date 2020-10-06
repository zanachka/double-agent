import BrowserStack from '@double-agent/profiler/lib/BrowserStack';
import Queue from "p-queue";
import {WebDriver} from "selenium-webdriver";
import IBrowserstackAgent from "@double-agent/profiler/interfaces/IBrowserstackAgent";
import * as Path from 'path';
import * as Fs from 'fs';

const useragentsPath = Path.resolve(__dirname, '../data/browserstack/useragents.json');
const drivers: WebDriver[] = [];
const runnerDomain = 'da-collect.ulixee.org';
const runnerPort = 3000;

const useragents = JSON.parse(Fs.readFileSync(useragentsPath, 'utf8'));
const useragentsIds: Set<string> = new Set(useragents.map(x => x.id));

process.on('exit', () => {
  drivers.forEach(x => {
    try { x.quit() } catch(err) {}
  });
});

export default async function updateBrowserStack() {
  const queue = new Queue({ concurrency: 5 });
  const capabilities = (await BrowserStack.getCapabilities()).filter(x => !x.real_mobile);

  console.log(`RUNNING ${capabilities.length} browsers`);
  console.log('---------------------');

  capabilities.forEach((capability, i) => {
    const { browser, browser_version, os, os_version } = capability;
    if (browser_version.includes('beta') || os_version.includes('beta')) return;
    const browserStackAgent = { browser: titleize(browser), browser_version, os, os_version };
    queue.add(getRunnerForAgent(browserStackAgent, i));
  });
  await queue.onIdle();

  console.log('---------------------');
  console.log(`FINISHED ${capabilities.length} browsers`);
}

const buildName = 'UserAgentBuilder';

function getRunnerForAgent(agent: IBrowserstackAgent, i: number) {
  return async function runnerForAgent() {
    const id = `${agent.browser}-${agent.browser_version}--${agent.os}-${agent.os_version}`;
    if (useragentsIds.has(id)) {
      console.log(`${i} - FOUND ${agent.browser} ${agent.browser_version} on ${agent.os} ${agent.os_version}`);
      return;
    }
    console.log(`${i} - Running ${agent.browser} ${agent.browser_version} on ${agent.os} ${agent.os_version}`);
    useragentsIds.add(id);

    const options = { buildName, chromeOptions: undefined };
    const driver = await BrowserStack.buildWebDriver(agent, options);
    drivers.push(driver);
    try {
      const source = await runUseragentInWebDriver(driver, i);
      const matches = source.match(/<span>(.+)<\/span>/i);
      if (!matches) {
        throw new Error(`Could not extract useragent: ${source}`);
      }
      const useragent = matches[1];
      useragents.push({ id, string: useragent });

      const lines = useragents.map(x => '  ' + JSON.stringify(x)).join(',\n');
      Fs.writeFileSync(useragentsPath, `[\n${lines}\n]`);

      console.log(`${i} - USERAGENT: `, useragent);
    } catch (error) {
      console.log(error);
    } finally {
      const idx = drivers.indexOf(driver);
      if (idx >= 0) drivers.splice(idx, 1);
      try {
        await driver.quit();
      } catch(err) {}
    }
  }
}

function titleize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function runUseragentInWebDriver(driver: WebDriver, i: number) {
  const url = `http://${runnerDomain}:${runnerPort}/user-agent`;
  await driver.get(url);
  console.log(`${i} - loaded url`)
  const source = await driver.getPageSource();
  console.log(`${i} - fetched source`)
  await driver.quit();
  return source;
}
