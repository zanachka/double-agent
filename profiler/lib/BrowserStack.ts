import axios from 'axios';
import webdriver from 'selenium-webdriver';
import IBrowser from '@double-agent/real-user-agents/interfaces/IBrowser';
import IOperatingSystem from '@double-agent/real-user-agents/interfaces/IOperatingSystem';
import IBrowserstackAgent from '../interfaces/IBrowserstackAgent';

export default class BrowserStack {
  static supportedCapabilities = [];

  public static async buildWebDriver(browser: IBrowserstackAgent, customCapabilities: any = {}) {
    const capabilities = {
      ...browser,
      ...browserstackSettings,
      'browserstack.selenium_version' : getSeleniumVersion(browser),
      ...customCapabilities,
      browserName: browser.browser,
    };

    try {
      return await new webdriver.Builder()
        .usingServer('http://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build();
    } catch (err) {
      console.log(capabilities);
      console.log(err);
      console.log("Couldn't build driver for %s", browser);
    }

    return null;
  }

  public static async createAgent(os: IOperatingSystem, browser: IBrowser) {
    let osVersion = os.version.name;
    if (!osVersion) {
      osVersion = os.version.major;
      if (os.version.minor && os.version.minor !== '0') {
        osVersion += `.${os.version.minor}`;
      }
    }
    const agent = {
      browser: browser.name,
      browser_version: `${browser.version.major}.${browser.version.minor}`,
      os: os.name.replace('Mac OS', 'OS X'),
      os_version: osVersion,
    };
    if (await this.isBrowserSupported(agent)) {
      return agent;
    }
  }

  static async getCapabilities() {
    if (!this.supportedCapabilities.length) {
      this.supportedCapabilities = await axios
        .get('https://api.browserstack.com/automate/browsers.json', {
          auth: {
            password: browserstackSettings['browserstack.key'],
            username: browserstackSettings['browserstack.user'],
          },
        })
        .then(x => x.data);
    }
    return this.supportedCapabilities;
  }

  private static async isBrowserSupported(agent: IBrowserstackAgent) {
    const { os, os_version, browser, browser_version } = agent;
    const capabilities = await BrowserStack.getCapabilities();
    const wasFound = capabilities.find(x => {
      return (
          x.os === os &&
          x.os_version === os_version &&
          x.browser === browser.toLowerCase() &&
          (x.browser_version === browser_version || x.browser_version === browser_version + '.0')
      );
    });
    return wasFound;
  }
}

const browserstackSettings = {
  resolution: '1024x768',
  'browserstack.user': process.env.BROWSERSTACK_USER,
  'browserstack.key': process.env.BROWSERSTACK_KEY,
  'browserstack.safari.allowAllCookies': 'true',
  'browserstack.console': 'errors',
  "browserstack.selenium_version" : "3.14.0",
  chromeOptions: {
    excludeSwitches: ['enable-automation'],
  },
  checkURL: 'false',
  buildName: 'Profiles',
  projectName: 'Double Agent',
};

function getSeleniumVersion({ browser, browser_version, os, os_version }) {
  const [majorVersion, minorVersion] = browser_version.split('.').map(x => Number(x));
  if (os === 'OS X' && os_version === 'Snow Leopard' && browser === 'Safari' && browser_version === '5.1') {
    return '2.5';
  } else if (os === 'OS X' && os_version === 'Mountain Lion' && browser === 'Safari' && browser_version === '6.2') {
      return '3.5.2';
  } else if (os === 'OS X' && os_version === 'Snow Leopard') {
    return '2.46.0'
  } else if (browser === 'Opera') {
    return '2.43.1';
  } else if (browser === 'Firefox' && browser_version === '4.0' && os === 'OS X' && os_version === 'Lion') {
    return '2.37.0'
  } else if (browser === 'Firefox' && os === 'XP') {
    return '2.53.1';
  } else if (browser == 'Firefox' && majorVersion < 45) {
    return '2.53.1';
  } else if (browser == 'Firefox' && majorVersion < 52) {
    return '3.2.0';
  }
  return '3.14.0';
}
