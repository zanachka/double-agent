import IBaseProfile from "../../../interfaces/IBaseProfile";

type IFontProfile = IBaseProfile<IFontProfileData>;

export default IFontProfile;

export interface IFontProfileData {
  fonts: string[];
}
