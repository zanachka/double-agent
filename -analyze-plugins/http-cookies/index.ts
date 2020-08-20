import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
import IRequestContext from '@double-agent/runner/interfaces/IRequestContext';
import CookieProfile from './lib/CookieProfile';
import checkCookieProfile from './lib/checkCookieProfile';
import checkCookieRequest from './lib/checkCookieRequest';

export default class HttpCookiesPlugin implements IDetectionPlugin {
  public static pagesToCheck = [
    '/run',
    '/run-redirect',
    '/run-page',
    '/main.css',
    '/results',
    '/results-redirect',
    '/results-page',
  ];

  public async onRequest(ctx: IRequestContext) {
    switch (ctx.url.pathname) {
      case '/results-page':
        await this.testResults(ctx);
        break;
      default:
        break;
    }

    if (HttpCookiesPlugin.pagesToCheck.includes(ctx.url.pathname)) {
      checkCookieRequest(ctx);
    }
  }

  private async testResults(ctx: IRequestContext) {
    const profile = new CookieProfile(ctx);
    if (ctx.requestDetails.secureDomain === false) {
      await profile.save();
    }

    checkCookieProfile(profile, ctx);
  }
}
