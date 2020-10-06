import * as Path from "path";
import UserAgent from "./lib/UserAgent";
import Browsers from "./lib/Browsers";
import OperatingSystems from "./lib/OperatingSystems";

export const FILE_PATH = Path.join(__dirname, './data/userAgentsById.json');

// LOAD DATA
let BY_ID: IUserAgentsById;
function load() {
  if (!BY_ID) {
    BY_ID = require(FILE_PATH) as IUserAgentsById;
    Object.keys(BY_ID).forEach(id => BY_ID[id] = UserAgent.load(BY_ID[id]));
  }
  return BY_ID;
}

export default class RealUserAgents {
  public static all() {
    return Object.values(load()).filter(userAgent => {
      const { name, version } = userAgent.browser;
      if (name === 'Chrome' && Number(version.major) < 58) return false;
      if (name === 'Edge' && Number(version.major) < 58) return false;
      if (name === 'Firefox' && Number(version.major) < 58) return false;
      if (name === 'Opera' && Number(version.major) < 58) return false;
      if (name === 'Safari' && Number(version.major) < 10) return false;
      if (name === 'IE') return false;
      return true;
    });
  }

  public static random(countToGet: number) {
    const availableUserAgents = this.all();
    const userAgentCount = availableUserAgents.length;

    const selectedUserAgents = [];
    while(selectedUserAgents.length < countToGet && selectedUserAgents.length < userAgentCount) {
      const selectedIndex = Math.floor(Math.random() * availableUserAgents.length);
      const selectedUserAgent = availableUserAgents.splice(selectedIndex, 1)[0];
      selectedUserAgents.push(selectedUserAgent);
    }

    return selectedUserAgents;
  }

  public static popular(marketshareNeeded: number) {
    const sortedUserAgents = this.all().sort((a,b) => b.marketshare - a.marketshare);
    const selectedUserAgents = [];
    let selectedMarketshare = 0;

    for (const userAgent of sortedUserAgents) {
      if (selectedMarketshare > marketshareNeeded) break;
      selectedMarketshare += userAgent.marketshare;
      selectedUserAgents.push(userAgent);
    }

    return selectedUserAgents;
  }

  public static getBrowser(id: string) {
    return Browsers.byId(id);
  }

  public static getOperatingSystem(id: string) {
    return OperatingSystems.byId(id);
  }
}

interface IUserAgentsById {
  [id: string]: UserAgent;
}


