import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import {PositiveMatcher} from "@double-agent/analyze/lib/matchers";
import Plugin from '@double-agent/analyze/lib/Plugin';
import CheckGenerator from "./lib/CheckGenerator";
import ITlsClienthelloProfile from "@double-agent/collect-tls-clienthello/interfaces/ITlsClienthelloProfile";
import {CheckType} from "../../lib/checks/BaseCheck";

export default class TlsClienthello extends Plugin {

  initialize(profiles: ITlsClienthelloProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'CLH',
      layerName: 'Client Hello',
      // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('CLH', profile.useragentId, checkGenerator.checks);
  }
}


