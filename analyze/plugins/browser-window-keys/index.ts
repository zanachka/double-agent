import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import {PositiveMatcher} from "@double-agent/analyze/lib/matchers";
import Plugin from '@double-agent/analyze/lib/Plugin';
import CheckGenerator from "./lib/CheckGenerator";
import IWindowKeysProfile from "@double-agent/collect-browser-window-keys/interfaces/IWindowKeysProfile";
import {CheckType} from "../../lib/checks/BaseCheck";

export default class BrowserCodecs extends Plugin {
  initialize(profiles: IWindowKeysProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'WIK',
      layerName: 'WindowKeys',
      // description: 'Checks that all the window property and type keys match the browser defaults on an insecure page (browsers disable certain features on non-ssl pages).',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('WIK', profile.useragentId, checkGenerator.checks);
  }
}


