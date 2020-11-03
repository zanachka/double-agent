import * as Fs from 'fs';
import { lookup } from 'useragent';
import { createOsIdFromUseragent } from './OsUtils';
import { createBrowserId } from './BrowserUtils';
import useragents from "../data/browserstack/useragents.json";
import { createUseragentIdFromKeys} from "@double-agent/profiler";
import IUserAgent from "../interfaces/IUserAgent";
import { FILE_PATH as OS_FILE_PATH } from "./OperatingSystems";
import { FILE_PATH as BROWSER_FILE_PATH } from "./Browsers";
import { FILE_PATH } from "../index";
import chromiumBuilds from '../data/google/chromiumBuilds.json';
import IBrowser from "../interfaces/IBrowser";
import IOperatingSystem from "../interfaces/IOperatingSystem";

export default class UserAgentGenerator {
  private byId: { [id: string]: IUserAgent } = {};

  public run() {
    const osesById = require(OS_FILE_PATH) as { [id: string]: IOperatingSystem };
    const browsersById = require(BROWSER_FILE_PATH) as { [id: string]: IBrowser };

    for (const useragent of useragents) {
      const { family: name, major, minor } = lookup(useragent.string);
      const version = { major, minor };
      const browserId = createBrowserId({ name, version });
      const osId = createOsIdFromUseragent(useragent.string);
      const useragentId = createUseragentIdFromKeys(osId, browserId);
      const strings = name === 'Chrome' ? this.expandChromeString(useragent.string, version) : [useragent.string];
      const userAgent: IUserAgent = {
        id: useragentId,
        strings,
        operatingSystemId: osId,
        browserId: browserId,
        marketshare: 0,
      }
      this.byId[useragentId] = userAgent;
    }

    for (const browser of Object.values(browsersById)) {
      const userAgents = Object.values(this.byId).filter(x => x.browserId === browser.id);
      const osPercentTotal = userAgents.reduce((total, x) => {
        return total + osesById[x.operatingSystemId].marketshare
      }, 0);
      for (const userAgent of userAgents) {
        const os = osesById[userAgent.operatingSystemId];
        const browser = browsersById[userAgent.browserId];
        const percentOfOsTraffic = os ? os.marketshare / osPercentTotal : 0;
        userAgent.marketshare = Math.floor(browser.marketshare * percentOfOsTraffic * 100) / 100;
      }
    }
    return this;
  }

  public save() {
    const userAgentsData = JSON.stringify(this.byId, null, 2);
    Fs.writeFileSync(FILE_PATH, userAgentsData);
    return this;
  }

  private expandChromeString(useragent: string, version: { major: string, minor: string }) {
    const regexp = new RegExp(`Chrome/(${version.major}\.${version.minor}\.([0-9]+)\.[0-9]+)`);
    const matches = useragent.match(regexp);
    const fullVersion = matches[1];
    const patchVersion = matches[2];
    const builds = chromiumBuilds.filter(x => x.startsWith(`${version.major}.${version.minor}.${patchVersion}`)).sort().reverse();
    if (!builds.some(x => useragent.includes(x))) {
      throw new Error(`COULD NOT FIND BUILD: ${useragent}`);
    }
    const useragents = [useragent];
    for (const build of builds) {
      useragents.push(useragent.replace(`Chrome/${fullVersion}`, `Chrome/${build}`));
    }

    return useragents;
  }
}
