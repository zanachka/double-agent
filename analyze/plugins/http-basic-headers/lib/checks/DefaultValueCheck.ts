import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class DefaultValueCheck extends BaseCheck {
  private readonly value: string[];

  public readonly prefix = 'DVAL';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, value: string[]) {
    super(identity, path);
    this.value = value;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.value.join('&')}`;
  }

  public get args() {
    return [this.value];
  }

  public mergeArgs(args1: any[], args2: any[]) {
    const array = args1[0].concat(args2[0]);
    return [array];
  }
}
