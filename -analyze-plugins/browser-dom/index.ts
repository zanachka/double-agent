import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
import IDomProfile from './interfaces/IDomProfile';
import checkProfile from './checks';
import ISession from "@double-agent/runner/interfaces/ISession";

export default class BrowserDomPlugin implements IDetectionPlugin {
  private static pluginName = 'browser/dom';

  async analyze(session: ISession) {
    const data = session.fetch('browser-dom');

    const agentProfile = {
      ...data,
      useragent: session.useragent,
    } as IDomProfile;

    try {
      await checkProfile(ctx, agentProfile);
    } catch (err) {
      console.log('ERROR checking dom profile', err);
    }
  }
}
