import Plugin from "../../lib/Plugin";
import IRequestTlsContext from "../../interfaces/IRequestTlsContext";
import {ITlsClienthelloProfileData} from "./interfaces/ITlsClienthelloProfile";

export default class TlsClienthelloPlugin extends Plugin {
  public initialize() {
    this.registerRoute('tls', '/', this.save);
    this.registerPages({ route: this.routes.tls['/'] });
  }

  public async save(ctx: IRequestTlsContext) {
    const profileData = {
      clientHello: ctx.req.clientHello,
    }

    ctx.session.savePluginProfileData<ITlsClienthelloProfileData>(this, profileData);
    ctx.res.end('Done');
  }
}
