import Cookie from 'cookie';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import { MainDomain, SubDomain, CrossDomain } from '@double-agent/collect';
import Plugin, {IPluginPage} from "../../lib/Plugin";
import Page from "../../lib/Page";
import cookiesScript from './cookiesScript';
import {DomainType} from "../../lib/DomainUtils";

export default class HttpCookiesPlugin extends Plugin {
  public initialize() {
    this.registerRoute('all', '/start', this.start);
    this.registerRoute('all', '/saveFromJs', this.saveFromJs);
    this.registerRoute('all', '/saveAndRedirectToNextPage', this.saveAndRedirectToNextPage);
    this.registerRoute('all', '/setAndRedirectToNextPage', this.setAndRedirectToNextPage);
    this.registerRoute('all', '/saveAndSet', this.saveAndSet);
    this.registerRoute('all', '/save', this.save);
    this.registerRoute('all', '/test.css', this.save);

    const pages: IPluginPage[] = [];

    ['http', 'https'].forEach(protocol => {
      pages.push(
        { route: this.routes[protocol]['/start'], domain: MainDomain, clickNext: true },
        { route: this.routes[protocol]['/saveAndRedirectToNextPage'], domain: MainDomain, bypassWait: true },
        { route: this.routes[protocol]['/setAndRedirectToNextPage'], domain: CrossDomain, bypassWait: true },
        { route: this.routes[protocol]['/saveAndRedirectToNextPage'], domain: MainDomain, bypassWait: true },
        { route: this.routes[protocol]['/setAndRedirectToNextPage'], domain: SubDomain, bypassWait: true },
        { route: this.routes[protocol]['/saveAndSet'], domain: SubDomain, clickNext: true },
        { route: this.routes[protocol]['/saveAndSet'], domain: CrossDomain, clickNext: true },
        { route: this.routes[protocol]['/save'], domain: MainDomain },
      );
    });

    this.registerPages(...pages);
  }

  private start(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.addNextPageClick();
    page.injectScript(cookiesScript(ctx));
    page.injectHeadTag(`<link rel="stylesheet" type="text/css" href="${ctx.buildUrl('/test.css')}" />`);
    ctx.res.setHeader('Set-Cookie', createCookies(ctx));
    ctx.res.end(page.html);
  }

  private saveFromJs(ctx: IRequestContext) {
    const cookies = Cookie.parse((ctx.requestDetails.bodyJson as any).cookies ?? '') as ICollectedCookies;
    saveCookiesToProfile(cookies, this, ctx);
    ctx.res.end();
  }

  private saveAndRedirectToNextPage(ctx: IRequestContext) {
    saveCookiesToProfile(collectCookies(ctx), this, ctx);
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    ctx.res.end();
  }

  private setAndRedirectToNextPage(ctx: IRequestContext) {
    ctx.res.setHeader('Set-Cookie', createCookies(ctx));
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    ctx.res.end();
  }

  private saveAndSet(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.addNextPageClick();
    saveCookiesToProfile(collectCookies(ctx), this, ctx);
    ctx.res.setHeader('Set-Cookie', createCookies(ctx));
    ctx.res.end(page.html);
  }

  private save(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.addNextPageClick();
    saveCookiesToProfile(collectCookies(ctx), this, ctx);
    ctx.res.end(page.html);
  }
}

////////////////////////////////////////////////////////////////

function createCookies(ctx: IRequestContext) {
  const domainType = ctx.requestDetails.domainType;
  const prefix = `${ctx.server.protocol}-${domainType}`;

  const cookies = [
    `${prefix}=0`,
    `${prefix}-ToBeExpired=start;`,
    `${prefix}-ToBeExpired=start; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `${prefix}--Secure=0; Secure`,
    `${prefix}--HttpOnly=0; HttpOnly`,
    `${prefix}--Expired=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `${prefix}--SameSiteLax=0; SameSite=Lax`,
    `${prefix}--SameSiteStrict=0; SameSite=Strict`,
    `${prefix}--SameSiteNone=0; SameSite=None`,
    `${prefix}--Secure-SameSiteLax=0; Secure; SameSite=Lax`,
    `${prefix}--Secure-SameSiteStrict=0; Secure; SameSite=Strict`,
    `${prefix}--Secure-SameSiteNone=0; Secure; SameSite=None`,
    `__Secure-${prefix}--Secure-SecurePrefix=0; Secure`,
    `__Host-${prefix}--Secure-HostPrefix-RootPath=0; Secure; Path=/`,
  ];

  if ([DomainType.MainDomain, DomainType.SubDomain].includes(domainType)) {
    cookies.push(
      `${prefix}--HttpOnly-RootDomain=0; HttpOnly; Domain=${MainDomain}`,
      `${prefix}--RootDomain-SameSiteNone=0; SameSite=None; Domain=${MainDomain}`,
      `${prefix}--RootDomain-Secure-SameSiteLax=0; Secure; SameSite=Lax; Domain=${MainDomain}`,
      `${prefix}--RootDomain-Secure-SameSiteStrict=0; Secure; SameSite=Strict; Domain=${MainDomain}`,
      `${prefix}--RootDomain-Secure-SameSiteNone=0; Secure; SameSite=None; Domain=${MainDomain}`,
    );
  }

  return cookies;
}

function collectCookies(ctx) {
  return Cookie.parse(ctx.req.headers.cookie ?? '');
}

function saveCookiesToProfile(cookies: ICollectedCookies, plugin: Plugin, ctx: IRequestContext) {
  const profile = ctx.session.getPluginProfile<ICookieProfile>(plugin, []);
  profile.push({ url: ctx.requestDetails.url, cookies });
  ctx.session.savePluginProfile(plugin, profile, true);
}

interface ICollectedCookies {
  [key: string]: string
}

interface ICookieProfileStep {
  url: string,
  cookies: ICollectedCookies;
}

type ICookieProfile = ICookieProfileStep[];
