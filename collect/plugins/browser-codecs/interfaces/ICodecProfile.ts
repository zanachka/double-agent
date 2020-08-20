import IWebRTCCodec from './IWebRTCCodec';
import ICodecSupport from './ICodecSupport';

export default interface ICodecProfile {
  audioSupport: ICodecSupport;
  videoSupport: ICodecSupport;
  webRtcVideoCodecs: IWebRTCCodec[];
  webRtcAudioCodecs: IWebRTCCodec[];
}
