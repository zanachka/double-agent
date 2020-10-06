import IWebRTCCodec from './IWebRTCCodec';
import ICodecSupport from './ICodecSupport';
import IBaseProfile from "../../../interfaces/IBaseProfile";

type ICodecProfile = IBaseProfile<ICodecProfileData>;

export default ICodecProfile;

export interface ICodecProfileData {
  audioSupport: ICodecSupport;
  videoSupport: ICodecSupport;
  webRtcVideoCodecs: IWebRTCCodec[];
  webRtcAudioCodecs: IWebRTCCodec[];
}
