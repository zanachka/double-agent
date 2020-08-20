import IRequestContext from "@double-agent/runner/interfaces/IRequestContext";
import WindowKeysProfile from "./lib/WindowKeysProfile";

export default async function probes(ctx: IRequestContext, browser: any) {
  const browserProfile = await WindowKeysProfile.find(ctx.session.useragent);
  const browserProfileKeys = browserProfile.httpWindowKeys;

  createProbe({
    idPrefix: 'BWK001',
    filter: { isHttpDomain: true, browser: browser },
    layer: 'browser',
    name: 'Insecure Page - Window Keys',
    category: 'Dom Features Match Version',
    description:
        'Checks that all the window property and type keys match the browser defaults on an insecure page (browsers disable certain features on non-ssl pages).',
    expected: browserProfileKeys.toString(),
    matcherType: 'ExactArray',
    scoringType: 'Binary'
  });

}

function createProbe(details: any) {

}
