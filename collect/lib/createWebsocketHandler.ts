import http from 'http';
import WebSocket from 'ws';
import * as net from 'net';
import ResourceType from '../interfaces/ResourceType';
import extractRequestDetails from './extractRequestDetails';
import RequestContext from '../lib/RequestContext';
import IServerContext from '../interfaces/IServerContext';
import { createUseragentId } from '@double-agent/profiler';
import BaseServer from "../servers/BaseServer";

export default function createWebsocketHandler(server: BaseServer, detectionContext: IServerContext) {
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  return async function websocketHandler(req: http.IncomingMessage, socket: net.Socket, head) {
    const { sessionTracker } = detectionContext;
    const session = sessionTracker.getSessionFromServerRequest(server, req);
    const { requestDetails, requestUrl } = await extractRequestDetails(server, req, session, ResourceType.WebsocketUpgrade);
    session.recordRequest(requestDetails);

    console.log(
      '%s %s: from %s (%s) %s',
      requestDetails.method,
      requestDetails.url,
      requestDetails.remoteAddress,
      createUseragentId(req.headers['user-agent']),
    );

    const ctx = new RequestContext(server, req, null, requestUrl, requestDetails, session);

    // ToDo: route request to Plugin handler

    const host = req.headers.host;
    wss.handleUpgrade(req, socket, head, async function(ws) {
      ws.on('message', function(...message) {
        console.log(`WS: Received websocket message ${message} on ${host}`);
        session.requests.push({
          time: new Date(),
          resourceType: ResourceType.WebsocketMessage,
          originType: requestDetails.originType,
          domainType: requestDetails.domainType,
          secureDomain: requestDetails.secureDomain,
          remoteAddress: requestDetails.remoteAddress,
          referer: requestDetails.referer,
          url: requestDetails.url.replace('http', 'ws'),
          origin: requestDetails.origin,
          bodyJson: message,
          useragent: requestDetails.useragent,
          method: null,
          headers: [],
        });
        ws.send('back at you');
      });
    });
  };
}
