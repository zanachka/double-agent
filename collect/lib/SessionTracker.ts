import { URL } from 'url';
import IRequestDetails from '../interfaces/IRequestDetails';
import Session from './Session';
import PluginDelegate from "./PluginDelegate";
import {CrossDomain, MainDomain, SubDomain} from "../index";

let sessionIdCounter = 0;
export default class SessionTracker {
  private pluginDelegate: PluginDelegate = new PluginDelegate();
  private sessions: { [sessionId: string]: Session } = {};

  public async createSession() {
    const sessionId = String((sessionIdCounter += 1));
    const session = new Session(sessionId, this, this.pluginDelegate);
    await session.startServers();

    this.sessions[sessionId] = session;
    return session;
  }

  public getSession(sessionId: string) {
    return this.sessions[sessionId];
  }

  public async deleteSession(sessionId: string) {
    if (!this.sessions[sessionId]) return;
    await this.sessions[sessionId].close();
    delete this.sessions[sessionId];
  }

  public recordRequest(requestDetails: IRequestDetails, requestUrl: URL) {
    const { useragent } = requestDetails;
    const sessionId = requestUrl.searchParams.get('sessionId');

    if (!sessionId) {
      throw new Error('Missing session');
    }

    const session = this.sessions[sessionId];
    if (!session.useragent) {
      session.setUseragent(useragent);
    }

    requestDetails.headers = requestDetails.headers.map(x => SessionTracker.cleanUrl(x, sessionId));
    requestDetails.origin = SessionTracker.cleanUrl(requestDetails.origin, sessionId);
    requestDetails.referer = SessionTracker.cleanUrl(requestDetails.referer, sessionId);
    requestDetails.url = SessionTracker.cleanUrl(requestDetails.url, sessionId);

    session.requests.push(requestDetails);

    return session;
  }

  public static cleanUrl(url: string, sessionId: string) {
    if (!url) return url;

    return url
      .replace(RegExp(SubDomain, 'g'), 'SubDomain')
      .replace(RegExp(MainDomain, 'g'), 'MainDomain')
      .replace(RegExp(CrossDomain, 'g'), 'CrossDomain')
      .replace(RegExp(`sessionId=${sessionId}`, 'g'), 'sessionId=X')
      .replace(RegExp(':[0-9]+/'), '/');
  }
}
