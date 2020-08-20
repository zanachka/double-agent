import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import windowKeysScript from './windowKeysScript';
import Plugin from "../../lib/Plugin";
import Page from "../../lib/Page";
import IWindowKeysProfile from "./interfaces/IWindowKeysProfile";

export default class BrowserDomPlugin extends Plugin {
  public initialize() {
    this.registerRoute('http', '/', this.loadScript);
    this.registerRoute('http', '/save', this.save);
    this.registerPages({ route: this.routes.http['/'], waitForReady: true });
  }

  public async loadScript(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.injectScript(windowKeysScript(ctx));
    ctx.res.end(page.html);
  }

  async save(ctx: IRequestContext) {
    const profile = ctx.requestDetails.bodyJson as IWindowKeysProfile;
    ctx.session.savePluginProfile(this, profile);
    ctx.res.end();
  }
}
