import IFlaggedCheck from './IFlaggedCheck';
import ICheckCounter from './ICheckCounter';

export default interface ISessionChecks {
  checks: ICheckCounter[];
  flaggedChecks: IFlaggedCheck[];
}
