import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import IWebRTCCodec from './interfaces/IWebRTCCodec';
import ICodecProfile from './interfaces/ICodecProfile';
import codecPageScript from './codecPageScript';
import Plugin from "../../lib/Plugin";
import Page from "../../lib/Page";

export default class BrowserCodecsPlugin extends Plugin {
  public initialize() {
    this.registerRoute('http', '/', this.loadScript);
    this.registerRoute('http', '/save', this.save);
    this.registerPages({ route: this.routes.http['/'], waitForReady: true });
  }

  private loadScript(ctx: IRequestContext) {
    const page = new Page(ctx);
    page.injectScript(codecPageScript(ctx));
    ctx.res.end(page.html);
  }

  public async save(ctx: IRequestContext) {
    const profile = cleanProfile(ctx.requestDetails.bodyJson as ICodecProfile);
    ctx.session.savePluginProfile<ICodecProfile>(this, profile);
    ctx.res.end();
  }
}

function cleanProfile(profile: ICodecProfile) {
  profile.audioSupport.probablyPlays.sort();
  profile.audioSupport.maybePlays.sort();
  profile.audioSupport.recordingFormats.sort();
  profile.videoSupport.probablyPlays.sort();
  profile.videoSupport.maybePlays.sort();
  profile.videoSupport.recordingFormats.sort();
  profile.webRtcAudioCodecs.sort(webRtcSort);
  profile.webRtcVideoCodecs.sort(webRtcSort);
  return profile;
}

function webRtcSort(a: IWebRTCCodec, b: IWebRTCCodec) {
  const mimeCompare = (a.mimeType ?? '').localeCompare(b.mimeType ?? '');
  if (mimeCompare !== 0) return mimeCompare;
  const clockCompare = a.clockRate - b.clockRate;
  if (clockCompare !== 0) return clockCompare;
  return (a.sdpFmtpLine ?? '').localeCompare(b.sdpFmtpLine ?? '');
}
