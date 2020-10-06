import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher} from "@double-agent/analyze/lib/matchers";
import Plugin from '@double-agent/analyze/lib/Plugin';
import CheckGenerator from "./lib/CheckGenerator";
import ICookieProfile from "@double-agent/collect-http-cookies/interfaces/ICookiesProfile";

export default class HttpCookies extends Plugin {
  initialize(profiles: ICookieProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'BAC',
      layerName: 'Basic Cookies',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks: checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('BAC', profile.useragentId, checkGenerator.checks);
  }
}


