// import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
// import { convertWebRtcCodecsToString, getProfileForUa } from './lib/CodecProfile';
// import ICodecSupport from './interfaces/ICodecSupport';
// import ICodecProfile from './interfaces/ICodecProfile';
// import IFlaggedCheck from '@double-agent/runner/interfaces/IFlaggedCheck';
// import ISession from "@double-agent/runner/interfaces/ISession";
//
// export default class BrowserCodecsPlugin implements IDetectionPlugin {
//   private static pluginName = 'browser-codecs';
//
//   public async analyze(session: ISession): Promise<void> {
//     this.checkProfile(session);
//   }
//
//   ///////////
//
//   private checkProfile(session: ISession) {
//     const codecs = session.fetch('codecs');
//     const currentProfile = codecs.profile;
//     const expectedProfile = getProfileForUa(session.useragent);
//     if (!expectedProfile) return;
//
//     for (const support of ['audio', 'video']) {
//       const title = support.charAt(0).toUpperCase() + support.slice(1);
//       const agentCodecSupport = currentProfile[support + 'Support'] as ICodecSupport;
//       const expectedAgentCodecSupport = expectedProfile[support + 'Support'] as ICodecSupport;
//
//       const codecEntry = {
//         category: `${title} Codecs Supported`,
//         description: `Checks that the browser agent supports the ${title} codecs found in a default installation`,
//         requestIdx: codecs.requestIdx,
//         layer: 'browser',
//         domainType: codecs.domainType,
//         resourceType: codecs.resourceType,
//       } as IFlaggedCheck;
//
//       for (const entry of [
//         ['probablyPlays', '"Probably" Playback'],
//         ['maybePlays', '"Maybe" Playback'],
//         ['recordingFormats', 'Recording'],
//       ]) {
//         const [property, name] = entry;
//         const provided = agentCodecSupport[property];
//         const expected = expectedAgentCodecSupport[property];
//         const checkName = `${title} ${name} Codecs`;
//         session.recordCheck(!expected.every(x => provided.includes(x)), {
//           ...codecEntry,
//           pctBot: 99,
//           value: provided.toString(),
//           expected: expected.toString(),
//           checkName,
//         });
//       }
//
//       const expected = convertWebRtcCodecsToString(expectedProfile[`webRtc${title}Codecs`]);
//       const value = convertWebRtcCodecsToString(currentProfile[`webRtc${title}Codecs`]);
//
//       session.recordCheck(expected !== value, {
//         ...codecEntry,
//         pctBot: 70,
//         category: `WebRTC ${title} Codecs Supported`,
//         checkName: `WebRTC ${title} MimeTypes and ClockRate Match`,
//         value,
//         expected,
//       });
//     }
//   }
// }
