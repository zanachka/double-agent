import { URL } from 'url';
import * as http from 'http';
import cookie from 'cookie';
import ResourceType from '../interfaces/ResourceType';
import IRequestDetails from '../interfaces/IRequestDetails';
import OriginType from '../interfaces/OriginType';
import {DomainType, getDomainType} from "./DomainUtils";
import BaseServer from "../servers/BaseServer";

export default async function extractRequestDetails(
  server: BaseServer,
  req: http.IncomingMessage,
  time: Date,
  overrideResourceType?: ResourceType,
) {
  const useragent = req.headers['user-agent'];
  const addr = req.connection.remoteAddress.split(':').pop() + ':' + req.connection.remotePort;
  const requestUrl = new URL(`${server.protocol}://${req.headers.host}${req.url}`);

  let body = '';
  let bodyJson: any = {};

  for await (const chunk of req) {
    body += chunk.toString();
  }

  if (req.headers['content-type'] === 'application/json') {
    bodyJson = JSON.parse(body);
  }

  const cookies = cookie.parse(req.headers.cookie ?? '');
  const rawHeaders = parseHeaders(req.rawHeaders);

  const requestDetails: IRequestDetails = {
    useragent,
    bodyJson,
    cookies,
    time,
    remoteAddress: addr,
    url: requestUrl.href,
    origin: req.headers['origin'] as string,
    originType: OriginType.None,
    referer: req.headers.referer,
    method: req.method,
    headers: rawHeaders,
    domainType: getDomainType(requestUrl),
    secureDomain: ['https','tls'].includes(server.protocol),
    resourceType: overrideResourceType ?? getResourceType(req.method, requestUrl.pathname),
  };

  // if origin sent, translate into origin type
  if (requestDetails.origin) {
    requestDetails.originType = getOriginType(new URL(requestDetails.origin), requestDetails.domainType);
  } else if (requestDetails.referer) {
    requestDetails.originType = getOriginType(new URL(requestDetails.referer), requestDetails.domainType);
  }

  return {
    requestDetails,
    requestUrl,
  };
}

export function getOriginType(referer: URL, hostDomainType: DomainType) {
  if (!referer) return OriginType.None;
  const refererDomainType = getDomainType(referer);

  if (hostDomainType === refererDomainType) {
    return OriginType.SameOrigin;
  }

  if (hostDomainType === DomainType.SubDomain && refererDomainType === DomainType.MainDomain) {
    return OriginType.SameSite;
  }

  if (hostDomainType === DomainType.MainDomain && refererDomainType === DomainType.SubDomain) {
    return OriginType.SameSite;
  }

  return OriginType.CrossSite;
}

export function getResourceType(httpMethod: string, pathname: string) {
  if (pathname === '/' || pathname.includes('-page')) {
    return ResourceType.Document;
  }
  if (pathname === '/run' || pathname === '/results' || pathname.includes('-redirect')) {
    return ResourceType.Redirect;
  }
  if (httpMethod === 'OPTIONS') {
    return ResourceType.Preflight;
  }
  if (pathname.endsWith('.js')) {
    return ResourceType.Script;
  }
  if (pathname.endsWith('.css')) {
    return ResourceType.Stylesheet;
  }
  if (pathname.endsWith('.png') || pathname.endsWith('.svg')) {
    return ResourceType.Image;
  }
  if (pathname.endsWith('.ico')) {
    return ResourceType.Ico;
  }

  return ResourceType.Xhr;
}

function parseHeaders(rawHeaders: string[]) {
  const headers = rawHeaders;
  const headerPrintout: string[] = [];
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];
    headerPrintout.push(`${key}=${value}`);
  }
  return headerPrintout;
}
