import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class ExpectedValueCheck extends BaseCheck {
  private readonly expectedValue: string | number;
  private readonly value: string | number;

  public readonly prefix = 'EVAL';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, expectedValue: string | number, value: string | number) {
    super(identity, path);
    this.expectedValue = expectedValue;
    this.value = value;
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.expectedValue}`;
  }

  public get args() {
    return [this.expectedValue, this.value];
  }

  public generateHumanScore(check: ExpectedValueCheck | null): number {
    super.generateHumanScore(check);
    return 100;
  }
}
