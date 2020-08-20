import Plugin, {IPluginPage} from "../../lib/Plugin";
import {CrossDomain, MainDomain, SubDomain} from "../../index";
import IRequestContext from "../../interfaces/IRequestContext";
import Page from "../../lib/Page";
import {DomainType} from "../../lib/DomainUtils";
import OriginType from "../../interfaces/OriginType";
import {IServerProtocol} from "../../servers/BaseServer";

export default class HttpHeadersPlugin extends Plugin {
  public initialize() {
    this.registerRoute('all', '/start', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page1', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page2', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page3', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/referToNext', this.linkToNextPage);
    this.registerRoute('all', '/useJsToLoadNextPage', this.saveAndUseJsToLoadNextPage);
    this.registerRoute('all', '/redirectToNextPage', this.saveAndRedirectToNextPage);
    this.registerRoute('all', '/gotoNext', this.showGotoNextPage);

    const pages: IPluginPage[] = [];

    ['http', 'https'].forEach(protocol => {
      pages.push(
          { route: this.routes[protocol]['/start'], domain: MainDomain, clickNext: true },
          { route: this.routes[protocol]['/referToNext'], domain: CrossDomain, clickNext: true },
          { route: this.routes[protocol]['/page1'], domain: MainDomain, clickNext: true },
          { route: this.routes[protocol]['/useJsToLoadNextPage'], domain: MainDomain },
          { route: this.routes[protocol]['/page2'], domain: MainDomain, clickNext: true },
          { route: this.routes[protocol]['/redirectToNextPage'], domain: MainDomain, bypassWait: true },
          { route: this.routes[protocol]['/page3'], domain: MainDomain, clickNext: true },
          { route: this.routes[protocol]['/page2'], domain: MainDomain, clickNext: true },
          { route: this.routes[protocol]['/gotoNext'], domain: MainDomain, waitForReady: true },
      );
    });

    this.registerPages(...pages);
  }

  public linkToNextPage(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.addNextPageClick();
    ctx.res.end(page.html);
  }

  public showGotoNextPage(ctx: IRequestContext) {
    const page = new Page(ctx);
    ctx.res.end(page.html);
  }

  public saveAndLinkToNextPage(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.addNextPageClick();
    saveHeadersToProfile(this, ctx);
    ctx.res.end(page.html);
  }

  public saveAndRedirectToNextPage(ctx: IRequestContext) {
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    saveHeadersToProfile(this, ctx);
    ctx.res.end();
  }

  public saveAndUseJsToLoadNextPage(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.injectScript(`<script type="text/javascript">
      (function() {
        window.afterReady = () => {
          setTimeout(() => {
            window.location.href = '${ctx.nextPageLink}';  
          }, 1e3);
        }
      })();
    </script>`);
    saveHeadersToProfile(this, ctx);
    ctx.res.end(page.html);
  }
}

////////////////////////

function saveHeadersToProfile(plugin: Plugin, ctx: IRequestContext) {
  const pathname = ctx.url.pathname;
  const { domainType, originType, method, referer } = ctx.requestDetails;
  const rawHeaders = ctx.req.rawHeaders;
  const protocol = ctx.server.protocol;

  const profile = ctx.session.getPluginProfile<IBasicHeadersProfile[]>(plugin, []);
  profile.push({ method, protocol, domainType, originType, pathname, referer, rawHeaders });
  ctx.session.savePluginProfile(plugin, profile, true);
}

interface IBasicHeadersProfile {
  method: string;
  protocol: IServerProtocol;
  domainType: DomainType;
  originType: OriginType;
  pathname: string;
  referer: string;
  rawHeaders: string[];
}
