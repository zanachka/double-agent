import ISession from '../interfaces/ISession';
import IAsset from '../interfaces/IAsset';
import IFlaggedCheck from '../interfaces/IFlaggedCheck';
import { Agent, lookup } from 'useragent';
import IRequestDetails from '../interfaces/IRequestDetails';
import IUserIdentifier from '../interfaces/IUserIdentifier';
import ICheckCounter from '../interfaces/ICheckCounter';
import { URL } from 'url';
import { IUserAgentToTestPickType, IUserAgentToTestUsagePercent } from '@double-agent/profiler/interfaces/IUserAgentToTest';
import IAssignment from '@double-agent/interfaces/IAssignment';
import IDetectionDomains from '../interfaces/IDetectionDomains';

export default class Session implements ISession {
  public readonly id: string;
  public readonly assetsNotLoaded: IAsset[] = [];
  public readonly checks: ICheckCounter[] = [];
  public readonly expectedAssets: (IAsset & { fromUrl?: string })[] = [];
  public expectedUseragent: string;

  public readonly flaggedChecks: IFlaggedCheck[] = [];
  public readonly identifiers: IUserIdentifier[] = [];
  public parsedUseragent: Agent;
  public readonly pluginsRun: string[] = [];
  public readonly requests: IRequestDetails[] = [];
  public useragent: string;

  private readonly pickTypes: IUserAgentToTestPickType[] = [];
  private readonly usagePercent: IUserAgentToTestUsagePercent;

  private tlsUrls: URL;
  private httpUrls: IDetectionDomains;
  private httpsUrls: IDetectionDomains;

  constructor(id: string, assignment?: IAssignment) {
    this.id = id;
    if (assignment) {
      this.pickTypes = assignment.pickTypes;
      this.usagePercent = assignment.usagePercent;
    }
  }

  public get pctBot() {
    let pctBot = 0;
    for (const flaggedCheck of this.flaggedChecks) {
      pctBot = Math.max(flaggedCheck.pctBot, pctBot);
    }
    return pctBot
  }

  public setUseragent(useragent: string) {
    this.useragent = useragent;
    this.parsedUseragent = lookup(useragent);
  }

  public recordCheck(
    flagCheck: boolean,
    flaggedCheck: IFlaggedCheck,
    skipPreviousRecordingCheck = false,
  ) {
    if (flagCheck) {
      this.flaggedChecks.push(flaggedCheck);
    }
    this.recordCheckRun(flaggedCheck, skipPreviousRecordingCheck);
    return flaggedCheck;
  }

  public toJSON() {
    return {
      id: this.id,
      pctBot: this.pctBot,
      pickTypes: this.pickTypes,
      usagePercent: this.usagePercent,
      assetsNotLoaded: this.assetsNotLoaded,
      checks: this.checks,
      expectedAssets: this.expectedAssets,
      expectedUseragent: this.expectedUseragent,
      flaggedChecks: this.flaggedChecks,
      identifiers: this.identifiers,
      parsedUseragent: this.parsedUseragent,
      pluginsRun: this.pluginsRun,
      requests: this.requests,
      useragent: this.useragent,
    }
  }

  private recordCheckRun(
    check: Pick<IFlaggedCheck, 'category' | 'layer' | 'checkName'>,
    skipPreviousRecordingCheck = false,
  ) {
    const { checkName, category, layer } = check;
    let entry = skipPreviousRecordingCheck
      ? null
      : this.checks.find(x => x.checkName === checkName && x.category === category);
    if (!entry) {
      entry = { checkName, category, layer, count: 0 };
      this.checks.push(entry);
    }
    entry.count += 1;
  }
}
