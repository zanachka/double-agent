import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';
import ICookieGetDetails from "../../interfaces/ICookieGetDetails";
import ICookieSetDetails from "../../interfaces/ICookieSetDetails";

export default class UnreadableCookieCheck extends BaseCheck {
  private readonly setDetails: ICookieSetDetails;
  private readonly getDetails: ICookieGetDetails;

  public readonly prefix = 'UCOO';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, setDetails: ICookieSetDetails, getDetails: ICookieGetDetails) {
    super(identity, path);
    this.setDetails = setDetails;
    this.getDetails = getDetails;
  }

  public get id() {
    const setDetails = Object.keys(this.setDetails).sort().map(k => this.setDetails[k]).join(',');
    const getDetails = Object.keys(this.getDetails).sort().map(k => this.getDetails[k]).join(',');
    return `${this.path}:${this.constructor.name}:${setDetails};${getDetails}`;
  }

  public get args() {
    return [this.setDetails, this.getDetails];
  }
}
