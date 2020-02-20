import webdriver, { until, WebDriver } from 'selenium-webdriver';
import Queue from 'p-queue';

const browsers = [
  ['Chrome', '80.0'],
  ['Chrome', '79.0'],
  ['Chrome', '78.0'],
  ['Chrome', '77.0'],
  ['Chrome', '76.0'],
  ['Chrome', '75.0'],
  ['Chrome', '74.0'],
  ['Chrome', '73.0'],
  ['Chrome', '72.0'],
  ['Chrome', '71.0'],
  ['Chrome', '70.0'],
  ['Firefox', '72.0'],
  ['Firefox', '65.0'],
  ['Edge', '18.0'],
  ['Edge', '17.0'],
];

const operatingSystems = [
  ['Windows', '10'],
  ['Windows', '7'],
  ['OS X', 'Catalina'],
  ['OS X', 'Yosemite'],
];

const urls = ['http://headers.ulixee.org', 'https://headers.ulixee.org'];

(async function run() {
  const queue = new Queue({ concurrency: 5 });
  for (const [browserName, browserv] of browsers) {
    for (const [os, osv] of operatingSystems) {
      for (const url of urls) {
        queue.add(async () => {
          console.log('Running %s %s on %s %s', browserName, browserv, os, osv);
          // Input capabilities
          const capabilities = {
            browserName,
            browser_version: browserv,
            os,
            os_version: osv,
            resolution: '1024x768',
            'browserstack.user': process.env.BROWSERSTACK_USER,
            'browserstack.key': process.env.BROWSERSTACK_KEY,
            name: 'headers-test',
            buildName: 'http-headers',
            projectName: 'Double Agent',
          };

          let driver: WebDriver = null;
          try {
            driver = await new webdriver.Builder()
              .usingServer('http://hub-cloud.browserstack.com/wd/hub')
              .withCapabilities(capabilities)
              .build();
          } catch (err) {
            console.log("Couldn't build driver for %s %s on %s %s", browserName, browserv, os, osv);
            return;
          }

          try {
            await driver.get(url);
            await driver.findElement(webdriver.By.id('start')).click();
            await driver.wait(until.elementLocated(webdriver.By.css('#results.loaded')));
          } finally {
            await driver.quit();
          }
        });
      }
    }
  }
  await queue.onEmpty();
})();