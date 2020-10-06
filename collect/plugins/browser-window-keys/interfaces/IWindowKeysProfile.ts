import IBaseProfile from "../../../interfaces/IBaseProfile";

type IWindowKeysProfile = IBaseProfile<IWindowKeysProfileData>;

export default IWindowKeysProfile;

export interface IWindowKeysProfileData {
  keys: string[];
}
