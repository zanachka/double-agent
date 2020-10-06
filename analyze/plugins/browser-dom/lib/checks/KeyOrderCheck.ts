import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class KeyOrderCheck extends BaseCheck {
  private readonly keys: string[];

  public readonly prefix = 'KORD';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, keys: string[]) {
    super(identity, path);
    this.keys = keys;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.keys.join(',')}`;
  }

  public get args() {
    return [this.keys];
  }
}
