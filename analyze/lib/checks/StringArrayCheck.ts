import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class StringArrayCheck extends BaseCheck {
  protected readonly value: string;

  public readonly prefix: string = 'STRA';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, value: string) {
    super(identity, path);
    this.value = value;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.value}`;
  }

  public get args() {
    return [this.value];
  }
}
