import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import { IUserAgentToTestPickType } from '@double-agent/profiler/interfaces/IUserAgentToTest';

export default interface IAssignment {
  id: string;
  type: IAssignmentType;
  useragent: string;
  pickType: IUserAgentToTestPickType;
  usagePercent: number;
  pagesByPlugin?: { [pluginId: string]: ISessionPage[] };
  sessionId?: string;
}

export enum AssignmentType {
  Individual = 'Individual',
  OverTime = 'OverTime',
}

export type IAssignmentType = keyof typeof AssignmentType;
