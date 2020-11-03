import ICookieProfile, {
  ICollectedCookieData,
  ICreatedCookieData
} from "@double-agent/collect-http-cookies/interfaces/ICookiesProfile";
import ReadableCookieCheck from "./checks/ReadableCookieCheck";
import UnreadableCookieCheck from "./checks/UnreadableCookieCheck";
import ICookieSetDetails from "../interfaces/ICookieSetDetails";

export default class CheckGenerator {
  private readonly profile: ICookieProfile;

  public readonly checks = [];

  constructor(profile: ICookieProfile) {
    this.profile = profile;
    this.extractChecks();
  }

  private extractChecks() {
    const { useragentId } = this.profile;

    const setCookiesMap = this.extractSetCookieDetails();
    const getCookiesMap: { [key: string]: { [getter: string]: Set<string> } } = {};

    for (const cookieData of this.profile.data) {
      const { group, getter, httpProtocol, cookies } = cookieData as ICollectedCookieData;
      if (!getter) continue;

      const key = `${httpProtocol}-${group}`;
      if (!setCookiesMap[key]) throw new Error(`no cookies created for ${key}`);
      getCookiesMap[key] = getCookiesMap[key] || {};
      getCookiesMap[key][getter] = getCookiesMap[key][getter] || new Set();

      for (const name of Object.keys(cookies)) {
        const setDetails = setCookiesMap[key][name];
        const getDetails = { getter, httpProtocol };
        if (!setDetails) throw new Error(`no cookies created for ${key} with name: ${name}`);
        this.checks.push(new ReadableCookieCheck({useragentId}, name, setDetails, getDetails));
        getCookiesMap[key][getter].add(name);
      }
    }

    for (const [key, cookiesByName] of Object.entries(setCookiesMap)) {
      for (const [name, setDetails] of Object.entries(cookiesByName)) {
        for (const [getter, names] of Object.entries(getCookiesMap[key])) {
          if (names.has(name)) continue;
          const httpProtocol = key.split('-')[0];
          const getDetails = { getter, httpProtocol };
          this.checks.push(new UnreadableCookieCheck({useragentId}, name, setDetails, getDetails));
        }
      }
    }
  }

  public extractSetCookieDetails() {
    const cookiesMap: { [key: string]: { [name: string]: ICookieSetDetails } } = {};

    for (const cookieData of this.profile.data) {
      const { group, setter, httpProtocol, cookies } = cookieData as ICreatedCookieData;
      const key = `${httpProtocol}-${group}`;
      if (!setter) continue;

      cookiesMap[key] = cookiesMap[key] || {};

      for (const createCookieStr of cookies) {
        const parts = createCookieStr.split(';').map(x => x.trim());
        const name = parts.splice(0, 1)[0].split('=')[0];
        const previouslyCreated = !!cookiesMap[key][name];
        const attributes: any = parts.map(part => {
          let [n, v] = part.split('=');
          if (n === 'expires') v = '[PAST DATE]'
          return v ? [n, v].join('=') : n;
        }).filter(x => x);

        cookiesMap[key][name] = {
          setter,
          name,
          previouslyCreated,
          attributes
        }
      }
    }

    return cookiesMap;
  }
}
