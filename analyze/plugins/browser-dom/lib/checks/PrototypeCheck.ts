import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class PrototypeCheck extends BaseCheck {
  private readonly prototypes: string[];

  public readonly prefix = 'PRTO';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, prototypes: string[]) {
    super(identity, path);
    this.prototypes = (prototypes ?? []).sort();
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.prototypes.join(',')}`;
  }

  public get args() {
    return [this.prototypes];
  }
}
