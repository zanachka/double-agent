import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin from "@double-agent/collect/lib/Plugin";
import { ITcpProfileData } from "./interfaces/ITcpProfile";
import trackRemoteTcpVars from "./lib/trackRemoteTcpVars";
import Document from "@double-agent/collect/lib/Document";

export default class TcpPlugin extends Plugin {
  private tracker: any;

  public initialize() {
    this.registerRoute('https', '/', this.extractData);

    this.onServerStart('https', () => {
      this.tracker = trackRemoteTcpVars(this.httpsServer.port);
      if (this.tracker.hasError) {
        console.log('------------- ERROR Starting TTL Tracker -------------\nTry starting server with sudo');
      }
    });

    this.onServerStop('https', () => {
      if (this.tracker) this.tracker.stop();
    });

    this.registerPages(
      { route: this.routes.https['/'] },
    );
  }

  public async extractData(ctx: IRequestContext) {
    if (this.tracker.hasError) return ctx.res.end();

    const profileData = await this.tracker.getPacket(ctx.requestDetails.remoteAddress);
    ctx.session.savePluginProfileData<ITcpProfileData>(this, profileData);

    const document = new Document(ctx);
    ctx.res.end(document.html);
  }
}
