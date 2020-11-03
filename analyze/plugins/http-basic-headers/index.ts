import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from "@double-agent/analyze/lib/matchers";
import Plugin from '@double-agent/analyze/lib/Plugin';
import CheckGenerator from "./lib/CheckGenerator";
import IBasicHeadersProfile from "@double-agent/collect-http-headers/interfaces/IBasicHeadersProfile";
import {CheckType} from "../../lib/checks/BaseCheck";

export default class HttpBasicHeaders extends Plugin {
  initialize(profiles: IBasicHeadersProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'BAH',
      layerName: 'Basic Headers',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('BAH', profile.useragentId, checkGenerator.checks);
  }
}


