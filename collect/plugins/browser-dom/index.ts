import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import domScript from './domScript';
import { IDomProfileData } from './interfaces/IDomProfile';
import Plugin from "../../lib/Plugin";
import Document from "../../lib/Document";

export default class BrowserDomPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/', this.loadScript);
    this.registerRoute('https', '/save', this.save);
    this.registerPages({ route: this.routes.https['/'], waitForReady: true });
  }

  private loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectScript(domScript(ctx));
    ctx.res.end(document.html);
  }

  public async save(ctx: IRequestContext) {
    const profileData = ctx.requestDetails.bodyJson as IDomProfileData;
    ctx.session.savePluginProfileData<IDomProfileData>(this, profileData);
    ctx.res.end();
  }
}
