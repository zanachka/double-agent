import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class ArrayCheck extends BaseCheck {
  private readonly hasLengthProperty: boolean;

  public readonly prefix = 'ARRY';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, hasLengthProperty: boolean) {
    super(identity, path);
    this.hasLengthProperty = hasLengthProperty;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:hasLengthProperty=${this.hasLengthProperty}`;
  }

  public get args() {
    return [this.hasLengthProperty];
  }
}
