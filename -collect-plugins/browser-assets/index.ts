import IRequestContext from "../../interfaces/IRequestContext";
import fs from "fs";
import {URL} from "url";
import OriginType from "@double-agent/collect/interfaces/OriginType";
import IDetectionDomains from "@double-agent/collect/interfaces/IDetectionDomains";
import {assetFromURL} from "@double-agent/collect/lib/Session";
import { getResourceType } from "@double-agent/collect/lib/extractRequestDetails";
import IAsset from "@double-agent/collect/interfaces/IAsset";
import ResourceType from "@double-agent/collect/interfaces/ResourceType";

// we might need to load js files from different domains

// <script src="${ctx.trackUrl('main.js', DomainType.MainDomain)}" type="application/javascript"></script>
// <script src="${ctx.trackUrl('main.js', DomainType.SubDomain)}" type="application/javascript"></script>
// <script src="${ctx.trackUrl('main.js', DomainType.CrossDomain)}" type="application/javascript"></script>

const serveFiles = {
  '/main.js': 'application/javascript',
  '/main.css': 'text/css',
  '/result.css': 'text/css',
  '/world.png': 'image/png',
  '/icon-wildcard.svg': 'image/svg+xml',
  '/favicon.ico': 'image/x-icon',
};

sendAsset(ctx);

const assets: { [path: string]: Buffer } = {};
function sendAsset(ctx: IRequestContext) {
  let pathname = ctx.url.pathname;
  if (pathname === '/result.css') pathname = '/main.css';
  ctx.res.writeHead(200, {
    'Content-Type': serveFiles[pathname],
  });
  if (!assets[pathname]) {
    assets[pathname] = fs.readFileSync(__dirname + '/../public' + pathname);
  }
  ctx.res.end(assets[pathname]);
}


// FROM SESSION

// public trackAsset(url: URL, origin: OriginType, baseUrls: IDetectionDomains, fromUrl?: string) {
//   url.searchParams.set('sessionId', this.id);
//   const asset: any = assetFromURL(url, origin, baseUrls);
//   asset.fromUrl = fromUrl;
//   this.expectedAssets.push(asset);
//   return url;
// }

// function assetFromURL(url: URL, originType: OriginType, baseUrls: IDetectionDomains) {
//   const domainType = getDomainType(url, baseUrls);
//   const asset: IAsset = {
//     pathname: url.pathname,
//     secureDomain: url.protocol === 'https:' || url.protocol === 'wss:',
//     domainType,
//     originType,
//     resourceType: url.protocol.startsWith('ws')
//         ? ResourceType.WebsocketUpgrade
//         : getResourceType('', url.pathname),
//   };
//   return asset;
// }
