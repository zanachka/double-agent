import BaseCheck, {CheckType, ICheckIdentity} from '@double-agent/analyze/lib/checks/BaseCheck';

type IOrderIndex = [string[], string[]];

export default class ArrayOrderIndexCheck extends BaseCheck {
  private readonly orderIndex: IOrderIndex;

  public readonly prefix = 'AORD';
  public readonly type = CheckType.Individual;

  constructor(identity: ICheckIdentity, path: string, orderIndex: IOrderIndex) {
    super(identity, path);
    this.orderIndex = orderIndex;
  }

  public get id() {
    const index = this.orderIndex.map(i => i.join(',')).join(';')
    return `${this.path}:${this.constructor.name}:${index}`;
  }

  public get args() {
    return [this.orderIndex];
  }
}
