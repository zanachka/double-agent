import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
import IRequestContext from '@double-agent/runner/interfaces/IRequestContext';
import FingerprintTracker from './lib/FingerprintTracker';
import IFingerprintProfile from './interfaces/IFingerprintProfile';
import * as fs from 'fs';
import FingerprintProfile from './lib/FingerprintProfile';
import fingerprintScript, {
  browserIgnoredAttributes,
  sessionIgnoredAttributes,
} from './fingerprintScript';
import ResourceType from '@double-agent/runner/interfaces/ResourceType';
import UserBucket from '@double-agent/runner/interfaces/UserBucket';
import { flaggedCheckFromRequest } from '@double-agent/runner/lib/flagUtils';
import ISession from "@double-agent/runner/interfaces/ISession";

const fingerprintJs = fs.readFileSync(require.resolve('fingerprintjs2/dist/fingerprint2.min.js'));

export default class BrowserFingerprintPlugin implements IDetectionPlugin {
  private pluginName = 'browser/fingerprint';

  async analyze(session: ISession) {

    const { sessionHash, browserHash, components } = profile;

    this.browserFingerprints.hit(browserHash, components);
    this.sessionFingerprints.hit(sessionHash, components);


    const priorFingerprint = session.identifiers.find(
      x => x.bucket === UserBucket.BrowserSingleSession,
    );

    if (priorFingerprint) {
      ctx.session.recordCheck(priorFingerprint.id !== profile.sessionHash, {
        ...flaggedCheckFromRequest(ctx, 'browser', 'Browser Fingerprint'),
        pctBot: 100,
        checkName: 'Browser Fingerprint Stable across Session',
        description: 'Checks if a browser fingerprint changes across requests',
        value: profile.sessionHash,
        expected: priorFingerprint.id,
      });

      const storedSessionValue = ctx.requestDetails.cookies['inconspicuous-cookie'] as string;
      ctx.session.recordCheck(storedSessionValue && priorFingerprint.id !== storedSessionValue, {
        ...flaggedCheckFromRequest(ctx, 'browser', 'Browser Fingerprint'),
        pctBot: 100,
        checkName: 'Browser Fingerprint Matches Cookie',
        description:
          'Checks if a browser fingerprint stored in a cookie is different than the fingerprint from this request',
        value: storedSessionValue,
        expected: priorFingerprint.id,
      });
    }
  }
}
