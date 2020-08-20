import {URL} from "url";
import {CrossDomain, MainDomain, SubDomain, TlsDomain} from "../index";

export enum DomainType {
  MainDomain = 'MainDomain',
  SubDomain = 'SubDomain',
  TlsDomain = 'TlsDomain',
  CrossDomain = 'CrossDomain',
}

export function getDomainType(url: URL | string) {
  const host = typeof url === 'string' ? url : url.host;
  const domain = extractDomainFromHost(host);
  if (domain === MainDomain) {
    return DomainType.MainDomain;
  } else if (domain === CrossDomain) {
    return DomainType.CrossDomain;
  } else if (domain === SubDomain) {
    return DomainType.SubDomain;
  } else if (domain === TlsDomain) {
    return DomainType.TlsDomain;
  } else {
    throw new Error(`Unknown domain type: ${domain}`);
  }
}

export function isRecognizedDomain(host: string, recognizedDomains: string[]) {
  const domain = extractDomainFromHost(host);
  return recognizedDomains.some(x => x === domain);
}

export function addSessionIdToUrl(url: string, sessionId: string) {
  if (!url) return url;
  const startUrl = new URL(url);
  startUrl.searchParams.set('sessionId', sessionId);
  return startUrl.href;
}

export function addPageIndexToUrl(url: string, pageIndex: number) {
  if (!url) return url;
  const startUrl = new URL(url);
  startUrl.searchParams.set('pageIndex', pageIndex.toString());
  return startUrl.href;
}

function extractDomainFromHost(host: string) {
  return host.split(':')[0];
}
