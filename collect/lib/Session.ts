import ISession from '../interfaces/ISession';
import IAsset from '../interfaces/IAsset';
import { Agent, lookup } from 'useragent';
import IRequestDetails from '../interfaces/IRequestDetails';
import IUserIdentifier from '../interfaces/IUserIdentifier';
import Plugin from "./Plugin";
import SessionTracker from "./SessionTracker";
import PluginDelegate from "./PluginDelegate";
import IBaseProfile from "../interfaces/IBaseProfile";
import { createUseragentId } from "@double-agent/profiler";
import { IAssignmentType } from "@double-agent/runner/interfaces/IAssignment";

export default class Session implements ISession {
  public readonly id: string;
  public readonly assignmentType: IAssignmentType;
  public readonly assetsNotLoaded: IAsset[] = [];
  public readonly expectedAssets: (IAsset & { fromUrl?: string })[] = [];
  public expectedUseragent: string;
  public parsedUseragent: Agent;

  public readonly identifiers: IUserIdentifier[] = [];
  public readonly pluginsRun: Set<string> = new Set();
  public readonly requests: IRequestDetails[] = [];
  public useragent: string;
  public onSavePluginProfile: (plugin: Plugin, profile: any) => void;

  public readonly sessionTracker: SessionTracker;
  public readonly pluginDelegate: PluginDelegate;

  private readonly profilesByPluginId: { [pluginId: string]: IBaseProfile } = {};
  private readonly currentPageIndexByPluginId: { [pluginId: string]: number } = {};
  constructor(id: string, assignmentType: IAssignmentType, sessionTracker: SessionTracker, pluginDelegate: PluginDelegate) {
    this.id = id;
    this.assignmentType = assignmentType;
    this.sessionTracker = sessionTracker;
    this.pluginDelegate = pluginDelegate;
  }

  public trackCurrentPageIndex(pluginId: string, currentPageIndex: number) {
    const lastPageIndex = this.currentPageIndexByPluginId[pluginId] || 0;
    if (currentPageIndex < lastPageIndex) {
      throw new Error(`You cannot go backwards in session. ${currentPageIndex} must be >= ${lastPageIndex}`);
    }
    this.currentPageIndexByPluginId[pluginId] = currentPageIndex;
  }

  public generatePages() {
    const pagesByPluginId = {};
    for (const plugin of this.pluginDelegate.plugins) {
      const pages = plugin.pagesForSession(this);
      if (pages.length) {
        pagesByPluginId[plugin.id] = pages;
      }
    }
    return pagesByPluginId;
  }

  public async startServers() {
    for (const plugin of this.pluginDelegate.plugins) {
      await plugin.createServersForSession(this);
    }
  }

  public recordRequest(requestDetails: IRequestDetails) {
    const { useragent } = requestDetails;

    if (!this.useragent) {
      this.setUseragent(useragent);
    }

    this.requests.push(requestDetails);
  }

  public setUseragent(useragent: string) {
    this.useragent = useragent;
    this.parsedUseragent = lookup(useragent);
  }

  public getPluginProfileData<TProfileData>(plugin: Plugin, data: TProfileData): TProfileData {
    if (!this.profilesByPluginId[plugin.id]) {
      this.profilesByPluginId[plugin.id] = {
        useragentId: createUseragentId(this.useragent),
        data,
      }
    }
    return this.profilesByPluginId[plugin.id].data;
  }

  public savePluginProfileData<TProfileData>(plugin: Plugin, data: TProfileData, keepInMemory: boolean = false) {
    const profile: IBaseProfile = {
      useragentId: createUseragentId(this.useragent),
      data,
    }
    if (keepInMemory) {
      this.profilesByPluginId[plugin.id] = profile;
    }
    if (this.onSavePluginProfile) {
      this.onSavePluginProfile(plugin, profile);
    }
    if (!keepInMemory) {
      delete this.profilesByPluginId[plugin.id];
    }
  }

  public toJSON() {
    return {
      id: this.id,
      assetsNotLoaded: this.assetsNotLoaded,
      expectedAssets: this.expectedAssets,
      expectedUseragent: this.expectedUseragent,
      identifiers: this.identifiers,
      parsedUseragent: this.parsedUseragent,
      pluginsRun: Array.from(this.pluginsRun),
      requests: this.requests,
      useragent: this.useragent,
    }
  }

  public async close() {
    for (const plugin of this.pluginDelegate.plugins) {
      await plugin.closeServersForSession(this.id);
    }
  }
}
