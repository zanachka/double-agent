import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
import { IBrowserToTestPickType, IBrowserToTestUsagePercent } from '@double-agent/profiler/lib/BrowsersToTest';

export default interface IAssignment {
  id: number;
  useragent: string;
  pickType: IBrowserToTestPickType;
  profileDirName: string;
  usagePercent: IBrowserToTestUsagePercent;
  pagesByPlugin?: { [pluginId: string]: ISessionPage[] };
  sessionId?: string;
  isCompleted?: boolean;
}
