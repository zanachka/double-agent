import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

type IData = { codeString: string } | { codeStringToString: string };

export default class SetterCheck extends BaseCheck {
  private readonly data: IData;

  public readonly prefix = 'SETR';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, data: IData) {
    super(identity, path);
    this.data = data;
  }

  public get id() {
    for (const key of Object.keys(this.data)) {
      return `${this.path}:${this.constructor.name}:${key}=${this.data[key]}`;
    }
  }

  public get args() {
    return [this.data];
  }
}
