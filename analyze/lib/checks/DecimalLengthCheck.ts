import BaseCheck, {CheckType, ICheckIdentity} from './BaseCheck';

export default class DecimalLengthCheck extends BaseCheck {
  private readonly length: number;

  public readonly prefix = 'DECL';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, length: number) {
    super(identity, path);
    this.length = length;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.length}`;
  }

  public get args() {
    return [this.length];
  }
}
