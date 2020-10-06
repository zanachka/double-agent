import OriginType from '@double-agent/runner/interfaces/OriginType';
import ResourceType from '@double-agent/runner/interfaces/ResourceType';
import ISession from '@double-agent/runner/interfaces/ISession';
import IRequestDetails from '@double-agent/runner/interfaces/IRequestDetails';
import Profiler from '@double-agent/profiler';
import { createUseragentId } from '@double-agent/profiler';

export default class HeaderProfile {
  public readonly requests: IHeadersRequest[];
  public readonly useragent: string;
  public readonly useragentId: string;

  public get browserAndVersion() {
    return this.useragentId.split('__').pop();
  }

  constructor(readonly session: ISession) {
    this.useragent = session.useragent;
    this.useragentId = createUseragentId(session.useragent);

    this.requests = session.requests.map(x => HeaderProfile.processRequestDetails(x, session));
  }

  public async save() {
    if (!process.env.GENERATE_PROFILES) return;

    const data = {
      requests: this.requests,
      useragent: this.useragent,
    } as IProfile;

    await Profiler.saveProfile('http/headers', this.useragent, data);
  }

  public static processRequestDetails(x: IRequestDetails, session: ISession) {
    return {
      url: x.url,
      method: x.method,
      requestIdx: session.requests.indexOf(x),
      resourceType: x.resourceType,
      originType: x.originType,
      headers: x.headers,
      secureDomain: x.secureDomain,
    } as IHeadersRequest;
  }

  public static getAllProfiles() {
    const entries: IProfile[] = [];
    Profiler.getProfiles('http/headers').forEach(entry => {
      entries.push({ requests: entry.requests, useragent: entry.useragent });
    });
    return entries;
  }
}

export interface IProfile {
  requests: IHeadersRequest[];
  useragent: string;
}

export interface IHeadersRequest {
  url: string;
  method: string;
  headers: string[];
  requestIdx: number;
  secureDomain: boolean;
  resourceType: ResourceType;
  originType: OriginType;
}
