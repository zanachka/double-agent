import PluginDelegate from '../lib/PluginDelegate';
import SessionTracker from '@double-agent/collect/lib/SessionTracker';
import Plugin from "../lib/Plugin";

export default interface IServerContext {
  readonly sessionTracker: SessionTracker;
  readonly pluginDelegate: PluginDelegate;
  readonly plugin: Plugin;
}
