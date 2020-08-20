import Plugin, { IRoutesByPath } from "../lib/Plugin";
import IServerContext from "../interfaces/IServerContext";

export type IServerProtocol = 'tls' | 'http' | 'https';

export default class BaseServer {
  private readonly routesByPath: IRoutesByPath = {};
  private context: IServerContext;

  public port: number
  public protocol: IServerProtocol;

  constructor(protocol: IServerProtocol, port: number, routesByPath: IRoutesByPath) {
    this.protocol = protocol;
    this.port = port;
    this.routesByPath = routesByPath;
  }

  public get plugin(): Plugin {
    return this.context.plugin;
  }

  public async start(context: IServerContext) {
    this.context = context;
    return this;
  }

  public cleanPath(rawPath: string) {
    return rawPath.replace(new RegExp(`^/${this.plugin.id}`), '');
  }

  public handler(rawPath: string) {
    const cleanedPath = this.cleanPath(rawPath);
    return this.routesByPath[cleanedPath]?.handler;
  }
}
