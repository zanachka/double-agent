import ICodecProfile from "@double-agent/collect-browser-codecs/interfaces/ICodecProfile";
import { convertWebRtcCodecsToString } from "./lib/CodecProfile";

export default async function generateProbes(browser: any) {
  const currentProfile = {} as ICodecProfile;
  const expectedProfile = {} as ICodecProfile;

  for (const support of ['audio', 'video']) {
    const title = support.charAt(0).toUpperCase() + support.slice(1);
    const agentCodecSupport = currentProfile[support + 'Support'];
    const expectedAgentCodecSupport = expectedProfile[support + 'Support'];

    const codecEntry = {
      category: `${title} Codecs Supported`,
      description: `Checks that the browser agent supports the ${title} codecs found in a default installation`,
      requestIdx: codecs.requestIdx,
      layer: 'browser',
      domainType: codecs.domainType,
      resourceType: codecs.resourceType,
    } as IFlaggedCheck;

    for (const entry of [
      ['probablyPlays', '"Probably" Playback'],
      ['maybePlays', '"Maybe" Playback'],
      ['recordingFormats', 'Recording'],
    ]) {
      const [property, name] = entry;
      const provided = agentCodecSupport[property];
      const expected = expectedAgentCodecSupport[property];
      const checkName = `${title} ${name} Codecs`;
      session.recordCheck(!expected.every(x => provided.includes(x)), {
        ...codecEntry,
        pctBot: 99,
        value: provided.toString(),
        expected: expected.toString(),
        checkName,
      });
    }

    const expected = convertWebRtcCodecsToString(expectedProfile[`webRtc${title}Codecs`]);
    const value = convertWebRtcCodecsToString(currentProfile[`webRtc${title}Codecs`]);

    session.recordCheck(expected !== value, {
      ...codecEntry,
      pctBot: 70,
      category: `WebRTC ${title} Codecs Supported`,
      checkName: `WebRTC ${title} MimeTypes and ClockRate Match`,
      value,
      expected,
    });
  }



  createProbe({
    idPrefix: 'BWK001',
    filter: { isHttpDomain: true, browser: browser },
    object: 'audioSupport.recordingFormats',
    layer: 'browser',
    name: 'Insecure Page - Window Keys',
    category: 'Dom Features Match Version',
    description:
        'Checks that all the window property and type keys match the browser defaults on an insecure page (browsers disable certain features on non-ssl pages).',
    expected: [
      "audio/webm",
      "audio/webm;codecs=opus",
      "audio/webm;codecs=pcm"
    ],
    matcherType: 'ExactArray',
    scoringType: 'Binary'
  });

}

function createProbe(details: any) {

}
