import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import IWebRTCCodec from './interfaces/IWebRTCCodec';
import { ICodecProfileData } from './interfaces/ICodecProfile';
import codecPageScript from './codecPageScript';
import Plugin from "../../lib/Plugin";
import Document from "../../lib/Document";

export default class BrowserCodecsPlugin extends Plugin {
  public initialize() {
    this.registerRoute('http', '/', this.loadScript);
    this.registerRoute('http', '/save', this.save);
    this.registerPages({ route: this.routes.http['/'], waitForReady: true });
  }

  private loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectScript(codecPageScript(ctx));
    ctx.res.end(document.html);
  }

  public async save(ctx: IRequestContext) {
    const profileData = cleanProfileData(ctx.requestDetails.bodyJson as ICodecProfileData);
    ctx.session.savePluginProfileData<ICodecProfileData>(this, profileData);
    ctx.res.end();
  }
}

function cleanProfileData(profile: ICodecProfileData) {
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
