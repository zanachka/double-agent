import IBaseProfile from "../../../interfaces/IBaseProfile";
import IClientHello from "@double-agent/tls-server/interfaces/IClientHello";

type ITlsClienthelloProfile = IBaseProfile<ITlsClienthelloProfileData>;

export default ITlsClienthelloProfile;

export interface ITlsClienthelloProfileData {
  clientHello: IClientHello
}
