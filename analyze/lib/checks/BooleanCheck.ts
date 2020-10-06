import BaseCheck, {ICheckIdentity, CheckType } from '@double-agent/analyze/lib/checks/BaseCheck';

export default class BooleanCheck extends BaseCheck {
  private readonly value: boolean;

  public readonly prefix = 'BOOL';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, value: boolean) {
    super(identity, path);
    this.value = value;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:value=${this.value}`;
  }

  public get args() {
    return [this.value];
  }
}
