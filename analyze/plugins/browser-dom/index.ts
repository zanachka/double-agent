import Plugin from '@double-agent/analyze/lib/Plugin';
import {NegativeMatcher, PositiveMatcher} from "@double-agent/analyze/lib/matchers";
import {DiffGradient} from "@double-agent/analyze/lib/scorers";
import CheckGenerator from "./lib/CheckGenerator";
import IDomProfile from "@double-agent/collect-browser-dom/interfaces/IDomProfile";
import {CheckType} from "../../lib/checks/BaseCheck";

export default class BrowserDom extends Plugin {
  initialize(profiles: IDomProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'DOM',
      layerName: 'Document Object Model',
      checks: checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('DOM', profile.useragentId, checkGenerator.checks);
  }
}
