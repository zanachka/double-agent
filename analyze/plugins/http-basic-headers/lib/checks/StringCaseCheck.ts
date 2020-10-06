import StringCheck from '@double-agent/analyze/lib/checks/StringCheck';
import {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class StringCaseCheck extends StringCheck {
  public readonly prefix = 'STRC';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, value: string) {
    super(identity, path, value);
  }

  public get id() {
    return `${this.path}:${this.constructor.name}:${this.value}`;
  }

  public get args() {
    return [this.value];
  }
}
