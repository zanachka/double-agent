import Plugin from "../../lib/Plugin";
import IRequestTlsContext from "../../interfaces/IRequestTlsContext";
import ITlsResult from "@double-agent/tls-server/interfaces/ITlsResult";

export default class TlsClienthelloPlugin extends Plugin {
  public initialize() {
    this.registerRoute('tls', '/', this.save);
    this.registerPages({ route: this.routes.tls['/'] });
  }

  public async save(ctx: IRequestTlsContext) {
    const {
      hasGrease,
      reason,
      ja3Extended,
      ja3ExtendedMd5,
      ja3,
      ja3Md5,
      ja3MatchFor,
      ja3erMatchFor,
      clientHello,
    } = ctx.req;

    const profile = {
      hasGrease,
      reason,
      ja3Extended,
      ja3ExtendedMd5,
      ja3,
      ja3Md5,
      ja3MatchFor,
      ja3erMatchFor,
      clientHello,
    }

    ctx.session.savePluginProfile<ITlsResult>(this, profile);
    ctx.res.end('Done');
  }
}
