import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class StacktraceCheck extends BaseCheck {
  private readonly errorClass: string;

  public readonly prefix = 'STCK';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, stacktrace: string) {
    super(identity, path);
    this.errorClass = stacktrace.split('\n').shift();
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:errorClass=${this.errorClass}`;
  }

  public get args() {
    return [this.errorClass];
  }
}
