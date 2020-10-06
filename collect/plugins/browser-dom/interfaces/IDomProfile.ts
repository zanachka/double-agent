import IBaseProfile from "../../../interfaces/IBaseProfile";

type IDomProfile = IBaseProfile<IDomProfileData>;

export default IDomProfile;

export interface IDomProfileData {
  window: any;
  detached: any;
}
