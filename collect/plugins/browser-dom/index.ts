import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import domScript from './domScript';
import IDomProfile from './interfaces/IDomProfile';
import Plugin from "../../lib/Plugin";
import Page from "../../lib/Page";

export default class BrowserDomPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/', this.loadScript);
    this.registerRoute('https', '/save', this.save);
    this.registerPages({ route: this.routes.https['/'], waitForReady: true });
  }

  private loadScript(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.injectScript(domScript(ctx));
    ctx.res.end(page.html);
  }

  public async save(ctx: IRequestContext) {
    const profile = ctx.requestDetails.bodyJson as IDomProfile;
    ctx.session.savePluginProfile<IDomProfile>(this, profile);
    ctx.res.end();
  }
}
