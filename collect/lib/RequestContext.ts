import IRequestContext from '../interfaces/IRequestContext';
import { IncomingMessage, ServerResponse } from 'http';
import IRequestDetails from '../interfaces/IRequestDetails';
import Session from './Session';
import { URL } from 'url';
import {addSessionIdToUrl, DomainType} from "./DomainUtils";
import {CrossDomain, MainDomain, SubDomain} from "../index";
import BaseServer, {IServerProtocol} from "../servers/BaseServer";
import Plugin from "./Plugin";

export default class RequestContext implements IRequestContext {
  private readonly plugin: Plugin;
  private readonly currentPageIndex: number;
  private readonly nextPageIndex: number;

  constructor(
    public readonly server: BaseServer,
    public readonly req: IncomingMessage,
    public readonly res: ServerResponse,
    public readonly url: URL,
    public readonly requestDetails: IRequestDetails,
    public readonly session: Session,
  ) {
    this.plugin = server.plugin;
    let pageIndexStr = url.searchParams.get('pageIndex');
    if (pageIndexStr) {
      const pages = this.plugin.pagesByAssignmentType[this.session.assignmentType];
      const pageIndex = Number(pageIndexStr);
      this.currentPageIndex = pageIndex;
      this.nextPageIndex = pageIndex + 1;
      if (this.nextPageIndex >= pages.length) this.nextPageIndex = undefined;
      this.session.trackCurrentPageIndex(this.plugin.id, this.currentPageIndex);
    }
  }

  public get page() {
    return this.plugin.pagesByAssignmentType[this.session.assignmentType][this.currentPageIndex];
  }

  public get nextPageLink() {
    if (this.nextPageIndex === undefined) return;
    const pageIndex = this.nextPageIndex;
    const page = this.plugin.pagesByAssignmentType[this.session.assignmentType][pageIndex];
    return this.plugin.convertToSessionPage(page, this.session.id, pageIndex).url;
  }

  public buildUrl(path: string, domainType?: DomainType, protocol?: IServerProtocol) {
    domainType = domainType || this.requestDetails.domainType;
    protocol = protocol || this.server.protocol;

    const { port, plugin } = this.plugin.getServer(protocol, this.session.id);

    let domain: string;
    if (domainType === DomainType.SubDomain) {
      domain = SubDomain;
    } else if (domainType === DomainType.CrossDomain) {
      domain = CrossDomain;
    } else if (domainType === DomainType.MainDomain) {
      domain = MainDomain;
    } else {
      throw new Error(`Unknown domainType: ${domainType}`);
    }

    const baseUrl = `${protocol}://${domain}:${port}`;
    const fullPath = `/${plugin.id}${path.startsWith('/') ? path : `/${path}`}`;
    const url = new URL(fullPath, baseUrl);

    if (domain === this.url.origin) {
      return [url.pathname, url.search].filter(Boolean).join('');
    }

    return addSessionIdToUrl(url.href, this.session.id);
  }
}
