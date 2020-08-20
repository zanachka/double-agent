import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
import IRequestContext from '@double-agent/runner/interfaces/IRequestContext';
import ForkedServerRunner from './lib/ForkedServerRunner';
import ITlsResult from './interfaces/ITlsResult';
import { isGreased } from './lib/buildJa3Extended';
import ClientHelloProfile from './lib/ClientHelloProfile';
import UserBucket from '@double-agent/runner/interfaces/UserBucket';
import { flaggedCheckFromRequest } from '@double-agent/runner/lib/flagUtils';
import { getProfileDirNameFromUseragent } from '@double-agent/profiler';


export default class TlsClientHelloPlugin implements IDetectionPlugin {
  private forkedServers = new Map<string, ForkedServerRunner>();
  private sessionTlsResults = new Map<string, ITlsResult>();

  public async stop() {
    for (const server of this.forkedServers) {
      server[1].stop();
    }
  }

  public async onRequest(ctx: IRequestContext) {
    const tlsResult = this.sessionTlsResults.get(ctx.session.id);

    if (!tlsResult) return;

    ctx.session.identifiers.push({
      raw: tlsResult.ja3Extended,
      bucket: UserBucket.TLS,
      category: 'TLS Handshake',
      id: tlsResult.ja3ExtendedMd5,
    });

    this.sessionTlsResults.delete(ctx.session.id);
    const expected = ClientHelloProfile.confirmedJa3s.find(
      x => getProfileDirNameFromUseragent(x.useragent) === getProfileDirNameFromUseragent(tlsResult.useragent),
    );
    if (!expected) {
      console.log('No tls profile for user agent', tlsResult.useragent);
      return;
    }

    ctx.session.recordCheck(!tlsResult.match, {
      ...flaggedCheckFromRequest(ctx, 'tls', 'TLS Handshake'),
      value: tlsResult.ja3Extended,
      checkName: 'TLS Fingerprint Match',
      description: 'Checks that the TLS ClientHello signature matches the provided user agent',
      expected: expected.ja3Extended,
      pctBot: 100,
      details:
        tlsResult.reason ??
        (tlsResult.ja3MatchFor?.length
          ? `Provided ja3 signature matches: [${tlsResult.ja3MatchFor.join(', ')}]`
          : tlsResult.ja3erMatchFor ?? 'Not a match for known browser signatures'),
    });

    const shouldBeGreased = isGreased(expected.ja3Extended);

    ctx.session.recordCheck(shouldBeGreased !== tlsResult.hasGrease, {
      ...flaggedCheckFromRequest(ctx, 'tls', 'TLS Handshake'),
      value: tlsResult.hasGrease ? 'Greased' : 'Not Greased',
      category: 'TLS Grease Used',
      checkName: 'TLS Grease in ClientHello',
      description: 'Checks that the TLS ClientHello mesage uses TLS Grease',
      expected: shouldBeGreased ? 'Greased' : 'Not Greased',
      pctBot: 100,
    });
    ctx.session.pluginsRun.push(`tls/clienthello`);
  }

  private async onTlsResult(message: ITlsResult, sessionId: string) {
    if (!message.useragent || this.sessionTlsResults.has(sessionId)) {
      return;
    }
    await ClientHelloProfile.saveProfile({
      useragent: message.useragent,
      ja3: message.ja3,
      ja3Md5: message.ja3Md5,
      ja3Extended: message.ja3Extended,
      ja3ExtendedMd5: message.ja3ExtendedMd5,
      clientHello: message.clientHello,
    });
    this.sessionTlsResults.set(sessionId, message);

    setTimeout(childServer => childServer.stop(), 500, this.forkedServers.get(sessionId));
    this.forkedServers.delete(sessionId);
  }
}
