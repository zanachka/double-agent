import {IServerProtocol} from "../../../servers/BaseServer";
import {DomainType} from "../../../lib/DomainUtils";
import OriginType from "../../../interfaces/OriginType";
import IBaseProfile from "../../../interfaces/IBaseProfile";

type IBasicHeadersProfile = IBaseProfile<IBasicHeadersProfileData>;

export default IBasicHeadersProfile;

export type IBasicHeadersProfileData = IBasicHeadersProfileDataPage[];

export interface IBasicHeadersProfileDataPage {
  pageName: string;
  method: string;
  protocol: IServerProtocol;
  domainType: DomainType;
  originType: OriginType;
  pathname: string;
  referer: string;
  rawHeaders: string[][];
}
