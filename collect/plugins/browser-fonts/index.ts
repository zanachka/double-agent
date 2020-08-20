import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import fontScript from './fontScript';
import IFontProfile from './interfaces/IFontProfile';
import Plugin from "../../lib/Plugin";
import Page from "../../lib/Page";

export default class BrowserFontsPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/', this.loadScript);
    this.registerRoute('https', '/save', this.save);
    this.registerPages({ route: this.routes.https['/'], waitForReady: true });
  }

  public async loadScript(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.injectScript(fontScript(ctx));
    ctx.res.end(page.html);
  }

  public async save(ctx: IRequestContext): Promise<void> {
    const profile = ctx.requestDetails.bodyJson as IFontProfile;
    ctx.session.savePluginProfile<IFontProfile>(this, profile);
    ctx.res.end();
  }
}
