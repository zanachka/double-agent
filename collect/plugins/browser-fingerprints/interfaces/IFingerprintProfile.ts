import IBaseProfile from "../../../interfaces/IBaseProfile";

type IFingerprintProfile = IBaseProfile<IFingerprintProfileData>;

export default IFingerprintProfile;

export type IFingerprintProfileData = IFingerprintProfileDataFingerprint[];

export interface IFingerprintProfileDataFingerprint {
  sessionHash: string;
  browserHash: string;
  components: { key: string; value: object }[];
  useragent: string;
}
