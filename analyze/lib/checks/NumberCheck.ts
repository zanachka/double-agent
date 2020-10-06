import BaseCheck, {CheckType, ICheckIdentity} from './BaseCheck';

export default class NumberCheck extends BaseCheck {
  private readonly value: number;
  private readonly label: string;

  public readonly prefix = 'NUMR';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, value: number, label?: string) {
    super(identity, path);
    this.value = value;
    this.label = label;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.value}`;
  }

  public get args() {
    return [this.value, this.label];
  }
}
