import * as fs from 'fs';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import {
  IFingerprintProfileData,
  IFingerprintProfileDataFingerprint
} from './interfaces/IFingerprintProfile';
import fingerprintScript from './fingerprintScript';
import Plugin from '../../lib/Plugin';
import Document from '../../lib/Document';

const fingerprintJs = fs.readFileSync(require.resolve('fingerprintjs2/dist/fingerprint2.min.js'));

export default class BrowserFingerprintPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/first', this.loadFingerprint);
    this.registerRoute('https', '/second', this.loadFingerprint);
    this.registerRoute('https', '/fingerprint.js', this.fingerprintJs);
    this.registerRoute('https', '/save', this.save);

    this.registerPages(
      { route: this.routes.https['/first'], waitForReady: true },
      { route: this.routes.https['/second'], waitForReady: true }
    );

    this.registerPagesOverTime(
      { route: this.routes.https['/first'], waitForReady: true }
    );
  }

  private loadFingerprint(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectScript(fingerprintScript(ctx));
    document.injectHeadTag(`<script src="${ctx.buildUrl('/fingerprint.js')}" type="text/javascript"></script>`);
    ctx.res.end(document.html);
  }

  async fingerprintJs(ctx: IRequestContext) {
    ctx.res.writeHead(200, { 'Content-Type': 'text/javascript' });
    ctx.res.end(fingerprintJs);
  }

  async save(ctx: IRequestContext) {
    const fingerprint = ctx.requestDetails.bodyJson as IFingerprintProfileDataFingerprint;
    const index = extractArrayIndex((fingerprint as any).originatedAt);
    const profileData = ctx.session.getPluginProfileData<IFingerprintProfileData>(this, []);
    const isFirstFingerprint = index === 0;

    profileData[index] = fingerprint;
    ctx.session.savePluginProfileData<IFingerprintProfileData>(this, profileData, isFirstFingerprint);
    ctx.res.end();
  }
}

function extractArrayIndex(originatedAt: string): 0 | 1 {
  if (originatedAt.includes('/first')) {
    return 0;
  }
  if (originatedAt.includes('/second')) {
    return 1;
  }
  throw new Error(`Could not extract array index from path: ${originatedAt}`)
}
