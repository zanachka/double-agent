import IBasicHeadersProfile from "@double-agent/collect-http-headers/interfaces/IBasicHeadersProfile";
import DefaultValueCheck from "./checks/DefaultValueCheck";
import StringCaseCheck from "./checks/StringCaseCheck";
import ArrayOrderIndexCheck from "./checks/ArrayOrderIndexCheck";

export default class CheckGenerator {
  private readonly profile: IBasicHeadersProfile;
  private readonly useragentId: string;
  private readonly officialDefaultsToCheck = new Set(officialDefaultsToCheck);

  public readonly checks = [];

  constructor(profile: IBasicHeadersProfile) {
    this.profile = profile;
    this.useragentId = profile.useragentId;
    this.addHeaderCaseChecks();
    this.addHeaderOrderChecks();
    this.addDefaultValueChecks();
  }

  private addDefaultValueChecks() {
    const { useragentId } = this;
    const defaultValuesMap: { [httpMethod: string]: { [key: string]: Set<string> } } = {};

    for (const page of this.profile.data) {
      const httpMethod = page.method;
      defaultValuesMap[httpMethod] = defaultValuesMap[httpMethod] || {};
      for (const [key, value] of page.rawHeaders) {
        if (!this.officialDefaultsToCheck.has(key.toLowerCase())) continue;
        defaultValuesMap[httpMethod][key] = defaultValuesMap[httpMethod][key] || new Set();
        defaultValuesMap[httpMethod][key].add(value);
      }
    }

    for (const [httpMethod, valuesByKey] of Object.entries(defaultValuesMap)) {
      for (const [key, values] of Object.entries(valuesByKey)) {
        const check = new DefaultValueCheck({ useragentId, httpMethod }, key, Array.from(values));
        this.checks.push(check);
      }
    }
  }

  private addHeaderCaseChecks() {
    const { useragentId } = this;

    for (const page of this.profile.data) {
      const httpMethod = page.method;
      for (const [key] of page.rawHeaders) {
        if (!isOfficialHeader(key)) continue;
        const check = new StringCaseCheck({ useragentId, httpMethod }, key.toLowerCase(), key);
        this.checks.push(check);
      }
    }
  }

  private addHeaderOrderChecks() {
    const { useragentId } = this;
    const allHeaderKeys: string[][] = [];

    for (const page of this.profile.data) {
      const headerKeys = extractOfficialHeaderKeys(page.rawHeaders);
      if (!headerKeys.length) continue;
      allHeaderKeys.push(headerKeys);
    }
    const orderIndexMap = extractOrderIndexMapFromArrays(allHeaderKeys);
    for (const key of Object.keys(orderIndexMap)) {
      const path = `headers.${key}`;
      const orderIndex = orderIndexMap[key];
      const check = new ArrayOrderIndexCheck({ useragentId }, path, orderIndex);
      this.checks.push(check);
    }
  }
}

function extractOrderIndexMapFromArrays(arrays: string[][]) {
  const tmpIndex: { [key: string]: { prev: Set<string>, next: Set<string> } } = {};
  const finalIndex: { [key: string]: [string[], string[]] } = {};

  for (const array of arrays) {
    array.forEach((key, i) => {
      tmpIndex[key] = tmpIndex[key] || { prev: new Set(), next: new Set() };
      array.slice(0, i).forEach(prev => tmpIndex[key].prev.add(prev));
      array.slice(i+1).forEach(next => tmpIndex[key].next.add(next));
      finalIndex[key] = finalIndex[key] || [[],[]];
      finalIndex[key][0] = Array.from(tmpIndex[key].prev);
      finalIndex[key][1] = Array.from(tmpIndex[key].next);
    });
  }

  return finalIndex;
}

function extractOfficialHeaderKeys(rawHeaders: string[][]) {
  return rawHeaders.map(x => x[0]).filter(x => {
    const lower = x.toLowerCase();
    for (const prefix of officialHeaderPrefixes) {
      if (lower.startsWith(prefix)) return true;
    }
    return officialHeaderKeys.has(lower);
  });
}

function isOfficialHeader(key: string) {
  const keyLower = key.toLowerCase();
  for (const prefix of officialHeaderPrefixes) {
    if (keyLower.startsWith(prefix)) return true;
  }
  return officialHeaderKeys.has(keyLower);
}

export const officialDefaultsToCheck = [
  'connection',
  'accept',
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-user',
  'sec-fetch-dest',
  'upgrade-insecure-requests',
  'accept-encoding',
  'accept-language', // Chrome headless will send en-US, while headed will send en-US,en;q=0.9 or en-US,en;q=0.9,und;q=0.8
];

const officialHeaderPrefixes = new Set([
    'sec-', // sec-fetch-mode, sec-fetch-site, sec-fetch-user, sec-origin-policy
    'proxy-' // proxy-authenticate, proxy-authorization, proxy-connection
]);

const officialHeaderKeys = new Set([
  'accept',
  'accept-charset',
  'accept-encoding',
  'accept-language',
  'accept-patch',
  'accept-ranges',
  'access-control-allow-credentials',
  'access-control-allow-headers',
  'access-control-allow-methods',
  'access-control-allow-origin',
  'access-control-expose-headers',
  'access-control-max-age',
  'access-control-request-headers',
  'access-control-request-method',
  'age',
  'allow',
  'alt-svc',
  'authorization',
  'cache-control',
  'connection',
  'content-disposition',
  'content-encoding',
  'content-language',
  'content-length',
  'content-location',
  'content-range',
  'content-type',
  'cookie',
  'date',
  'expect',
  'expires',
  'forwarded',
  'from',
  'host',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'if-unmodified-since',
  'last-modified',
  'location',
  'origin',
  'pragma',
  'public-key-pins',
  'range',
  'referer',
  'retry-after',
  'set-cookie',
  'strict-transport-security',
  'tk',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'upgrade-insecure-requests',
  'user-agent',
  'vary',
  'via',
  'warning',
  'www-authenticate',
]);
