import { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs';
import { URL } from 'url';
import IRequestContext from '../interfaces/IRequestContext';
import extractRequestDetails from './extractRequestDetails';
import RequestContext from '../lib/RequestContext';
import IServerContext from '../interfaces/IServerContext';
import { createUseragentId } from '@double-agent/profiler';
import BaseServer from "../servers/BaseServer";
import {CrossDomain, MainDomain, SubDomain} from "../index";
import {isRecognizedDomain} from "./DomainUtils";
import http from "http";

export default function createHttpRequestHandler(server: BaseServer, serverContext: IServerContext) {
  return async function requestHandler(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'HEAD') {
      // BrowserStack sends head requests to check if a domain is active. not part of the tests..
      console.log('HEAD request inbound. Should not be getting this.', req.url, req.headers);
      return res.end();
    }

    const { sessionTracker } = serverContext;
    const requestUrl = new URL(`${server.protocol}://${req.headers.host}${req.url}`);

    if (!isRecognizedDomain(req.headers.host, [MainDomain, SubDomain, CrossDomain])) {
      throw new Error('Invalid domain used to access site');
    }

    if (requestUrl.pathname === '/favicon.ico') {
      return sendFavicon(res);
    }

    try {
      const session = sessionTracker.getSessionFromServerRequest(server, req);
      const { requestDetails } = await extractRequestDetails(server, req, session);
      const ctx = new RequestContext(server, req, res, requestUrl, requestDetails, session);
      const useragentId = createUseragentId(req.headers['user-agent']);
      session.recordRequest(requestDetails);

      console.log(
        '%s %s: from %s (%s)',
        requestDetails.method,
        requestDetails.url,
        requestDetails.remoteAddress,
        useragentId,
      );

      const handler = server.handler(requestUrl.pathname);
      if (req.method === 'OPTIONS') {
        sendPreflight(ctx);
      } else if (handler) {
        await handler(ctx)
      } else {
        res.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
      }
    } catch (err) {
      console.log('Request error %s %s', req.method, req.url, err);
      res.writeHead(500, err.message).end();
    }
  };
}

function sendPreflight(ctx: IRequestContext) {
  ctx.res.writeHead(204, {
    'Access-Control-Allow-Origin': ctx.req.headers.origin,
    'Access-Control-Allow-Methods': 'GET,POST',
    'Access-Control-Allow-Headers': ctx.req.headers['access-control-request-headers'] ?? '',
    'Content-Length': 0,
    Vary: 'Origin',
  });
  ctx.res.end('');
}

function sendFavicon(res: ServerResponse) {
  const asset = fs.readFileSync(__dirname + '/../public/favicon.ico');
  res.writeHead(200, { 'Content-Type': 'image/x-icon' });
  res.end(asset);
}
