import IAssignment from '../interfaces/IAssignment';
import BrowsersToTest, {
  IBrowserToTestPickType,
  IBrowserToTestUsagePercent
} from '@double-agent/profiler/lib/BrowsersToTest';
import { getProfileDirNameFromUseragent } from '@double-agent/profiler';

export default async function getAllAssignments(browsersToTest: BrowsersToTest) {
  const assignments: IAssignment[] = [];
  for (const browserToTest of browsersToTest.all) {
    const browserStackUseragent = browserToTest.useragents.find(x => x.sources.includes('BrowserStack'));
    const assignment = await buildAssignment(
      assignments.length,
      browserStackUseragent ? browserStackUseragent.string : browserToTest.useragents[0].string,
      browserToTest.usagePercent,
      browserToTest.pickType,
    );
    assignments.push(assignment);
  }

  return assignments.slice(0, 1);
}

export async function buildAssignment(
  assignmentId: number,
  useragent: string = null,
  usagePercent: IBrowserToTestUsagePercent = null,
  pickType: IBrowserToTestPickType = [],
) {
  const profileDirName = useragent ? getProfileDirNameFromUseragent(useragent) : null;
  return {
    id: assignmentId,
    useragent: useragent,
    pickType: pickType,
    usagePercent: usagePercent,
    profileDirName: profileDirName,
  } as IAssignment;
}
