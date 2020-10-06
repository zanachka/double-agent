import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class TypeCheck extends BaseCheck {
  private readonly value: string;

  public readonly prefix = 'TYPE';
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
