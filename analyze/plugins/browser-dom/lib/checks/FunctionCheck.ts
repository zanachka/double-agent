import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class FunctionCheck extends BaseCheck {
  private readonly codeString: string;
  private readonly methods: { [name: string]: string };
  private readonly invocation: string;

  public readonly prefix = 'FUNC';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, codeString: string, methods: { [name: string]: string }, invocation: string) {
    super(identity, path);
    this.codeString = codeString;
    this.methods = methods;
    this.invocation = invocation;
  }

  public get id() {
    let methods = Object.entries(this.methods).map((name,value) => `${name}=${value}`).join(';');
    return `${this.path}:${this.constructor.name}:codeString=${this.codeString};${methods};invocation=${this.invocation}`;
  }

  public get args() {
    return [this.codeString, this.methods, this.invocation];
  }
}
