import ISession from '../interfaces/ISession';
import IAsset from '../interfaces/IAsset';
import { Agent, lookup } from 'useragent';
import IRequestDetails from '../interfaces/IRequestDetails';
import IUserIdentifier from '../interfaces/IUserIdentifier';
import Plugin from "./Plugin";
import SessionTracker from "./SessionTracker";
import PluginDelegate from "./PluginDelegate";

export default class Session implements ISession {
  public readonly id: string;
  public readonly assetsNotLoaded: IAsset[] = [];
  public readonly expectedAssets: (IAsset & { fromUrl?: string })[] = [];
  public expectedUseragent: string;
  public parsedUseragent: Agent;

  public readonly identifiers: IUserIdentifier[] = [];
  public readonly pluginsRun: Set<string> = new Set();
  public readonly requests: IRequestDetails[] = [];
  public useragent: string;
  public onSavePluginProfile: (plugin: Plugin, profile: any) => void;

  private readonly sessionTracker: SessionTracker;
  private readonly pluginDelegate: PluginDelegate;
  private readonly profilesByPluginId: { [pluginId: string]: any } = {};

  constructor(id: string, sessionTracker: SessionTracker, pluginDelegate: PluginDelegate) {
    this.id = id;
    this.sessionTracker = sessionTracker;
    this.pluginDelegate = pluginDelegate;
  }

  public get pages() {
    const plugins = {};
    for (const plugin of this.pluginDelegate.plugins) {
      plugins[plugin.id] = plugin.pagesForSession(this.id);
    }
    return plugins;
  }

  public async startServers() {
    for (const plugin of this.pluginDelegate.plugins) {
      await plugin.createServersForSession(this.id, this.sessionTracker, this.pluginDelegate);
    }
  }

  public setUseragent(useragent: string) {
    this.useragent = useragent;
    this.parsedUseragent = lookup(useragent);
  }

  public getPluginProfile<T>(plugin: Plugin, defaultProfile: T): T {
    if (!this.profilesByPluginId[plugin.id]) {
      this.profilesByPluginId[plugin.id] = defaultProfile;
    }
    return this.profilesByPluginId[plugin.id];
  }

  public savePluginProfile<T>(plugin: Plugin, profile: T, keepInMemory: boolean = false) {
    if (keepInMemory) {
      this.profilesByPluginId[plugin.id] = profile;
    }
    if (this.onSavePluginProfile) {
      this.onSavePluginProfile(plugin, profile);
    }
  }

  public addIdentifier(identifier: any) {
    console.log('SAVING IDENTIFIER for ', identifier.pluginName);
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
      const profile = this.profilesByPluginId[plugin.id];
      if (profile?.isPending) {
        this.savePluginProfile(plugin, profile.data);
      }
      await plugin.closeServersForSession(this.id);
    }
  }
}
