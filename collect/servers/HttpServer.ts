import http from 'http';
import createHttpRequestHandler from '../lib/createHttpRequestHandler';
import createWebsocketHandler from '../lib/createWebsocketHandler';
import IServerContext from "../interfaces/IServerContext";
import BaseServer  from "./BaseServer";
import {IRoutesByPath} from "../lib/Plugin";

export default class HttpServer extends BaseServer {
  private httpServer: http.Server;

  constructor(port: number, routesByPath: IRoutesByPath) {
    super('http', port, routesByPath);
  }

  public async start(context: IServerContext) {
    await super.start(context);
    const options = {} as http.ServerOptions;
    const httpRequestHandler = createHttpRequestHandler(this, context);
    const websocketHandler = createWebsocketHandler(this, context);

    this.httpServer = await new Promise<http.Server>(resolve => {
      const server = http.createServer(options, httpRequestHandler);
      server.on('upgrade', websocketHandler)
      server.listen(this.port, () => resolve(server));
    });

    return this;
  }

  public async stop(): Promise<any> {
    this.httpServer.close();
    console.log(`HTTP Server closed (port: ${this.port}`);
  }
}
