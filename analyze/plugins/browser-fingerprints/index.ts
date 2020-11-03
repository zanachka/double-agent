import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from "@double-agent/analyze/lib/matchers";
import Plugin from '@double-agent/analyze/lib/Plugin';
import CheckGenerator from "./lib/CheckGenerator";
import IFingerprintProfile from "@double-agent/collect-browser-fingerprints/interfaces/IFingerprintProfile";

export default class BrowserFingerprints extends Plugin {
  initialize(profiles: IFingerprintProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'FNG',
      layerName: 'Fingerprints',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks: checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  runIndividual(profile: IFingerprintProfile) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('FNG', profile.useragentId, checkGenerator.checks);
  }

  runOverTime(profile: IFingerprintProfile, profileCountOverTime: number) {
    if (!profileCountOverTime) {
      throw new Error('profileCountOverTime must be > 0');
    }
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('FNG', profile.useragentId, checkGenerator.checks, profileCountOverTime);
  }
}


