import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
import IRequestContext from '@double-agent/runner/interfaces/IRequestContext';
import fontScript from './fontScript';
import IFontProfile from './interfaces/IFontProfile';
import FontProfile from './lib/FontProfile';
import crypto from 'crypto';
import UserBucket from '@double-agent/runner/interfaces/UserBucket';
import { sendJson } from '@double-agent/runner/lib/httpUtils';

export default class BrowserFontsPlugin implements IDetectionPlugin {
  private static pluginName = 'browser/fonts';
  public async onRequest(ctx: IRequestContext) {
    // only load on the secure domain
    if (
      ctx.url.pathname === '/run-page' &&
      !ctx.session.pluginsRun.includes(BrowserFontsPlugin.pluginName)
    ) {
      ctx.extraScripts.push(fontScript(ctx));
    }
  }

  public async handleResponse(ctx: IRequestContext): Promise<boolean> {
    const requestUrl = ctx.url;
    if (requestUrl.pathname === '/fonts') {
      ctx.session.pluginsRun.push(BrowserFontsPlugin.pluginName);

      const body = ctx.requestDetails.bodyJson as { fonts: string[] };
      const agentProfile = await FontProfile.save(ctx.requestDetails.useragent, body?.fonts);

      this.checkProfile(ctx, agentProfile);

      sendJson(ctx, { success: true });
      return true;
    }
    return false;
  }

  private checkProfile(ctx: IRequestContext, fontProfile: IFontProfile) {
    const fontList = fontProfile.fonts.sort().join(',');
    const fontFingerprint = crypto
      .createHash('md5')
      .update(fontList)
      .digest('hex');

    ctx.session.identifiers.push({
      id: fontFingerprint,
      category: 'Font Fingerprint',
      bucket: UserBucket.Font,
      description: `Calculates a hash from fonts available in the browser`,
    });

    // TODO: find a reliable method of determining which are default fonts for a browser/os
    //  ie, how do we know what level of confidence a browser is faking their fonts?
    // const browserFonts = FontProfile.findMatch(false, ctx.session.parsedUseragent)?.fonts ?? [];
    // const missingFonts = browserFonts.filter(x => !fontProfile.fonts.includes(x)).length;
    // const missingPercent = Math.round((100 * missingFonts) / browserFonts.length);
    // ctx.session.recordCheck(missingPercent > 25, {
    //   ...flaggedCheckFromRequest(ctx, 'http', 'Fonts Supported'),
    //   pctBot: 70,
    //   checkName: `Fonts Match OS/Browser Default`,
    //   description:
    //     'Checks that the fonts supported by the browser match within 25% of the default fonts for the browser/os',
    //   value: fontProfile.fonts.join(', '),
    //   expected: browserFonts.join(', '),
    // });
  }
}
