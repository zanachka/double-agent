import IBaseProfile from "@double-agent/collect/interfaces/IBaseProfile";

type ITcpProfile = IBaseProfile<ITcpProfileData>;

export default ITcpProfile;

export interface ITcpProfileData {
  windowSize: number;
  ttl: number
}
