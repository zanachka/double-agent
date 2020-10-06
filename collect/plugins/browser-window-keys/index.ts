import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import windowKeysScript from './windowKeysScript';
import Plugin from "../../lib/Plugin";
import Document from "../../lib/Document";
import { IWindowKeysProfileData } from "./interfaces/IWindowKeysProfile";

export default class BrowserDomPlugin extends Plugin {
  public initialize() {
    this.registerRoute('http', '/', this.loadScript);
    this.registerRoute('http', '/save', this.save);
    this.registerPages({ route: this.routes.http['/'], waitForReady: true });
  }

  public async loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectScript(windowKeysScript(ctx));
    ctx.res.end(document.html);
  }

  async save(ctx: IRequestContext) {
    const profileData = ctx.requestDetails.bodyJson as IWindowKeysProfileData;
    ctx.session.savePluginProfileData<IWindowKeysProfileData>(this, profileData);
    ctx.res.end();
  }
}
