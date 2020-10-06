import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class FlagsCheck extends BaseCheck {
  private readonly flags: string[];

  public readonly prefix = 'FLAG';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, flags: string[]) {
    super(identity, path);
    this.flags = (flags ?? []).sort();
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.flags.join('')}`;
  }

  public get args() {
    return [this.flags];
  }
}
