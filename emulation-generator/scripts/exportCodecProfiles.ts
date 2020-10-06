import * as Fs from 'fs';
import 'source-map-support/register';
import ICodecProfile from '@double-agent/browser-codecs/interfaces/ICodecProfile';
import { lookup } from 'useragent';
import emulators from '../emulators.json';

const browserKeys: string[] = emulators.map(x => x.key);

const emulationsDir = process.env.PLUGIN_DIR ?? `${__dirname}/../data/emulations`;

export default async function exportCodecProfiles() {
  const profilesByBrowserKey: {
    [browserKey: string]: {
      profile: Omit<ICodecProfile, 'useragent'>;
      opSyses: string[];
    }[];
  }[] = [];

  for (const [agentKey, profiles] of Object.entries(getAllProfiles())) {
    const browserKey = browserKeys.find(x => agentKey.includes(x));
    if (!browserKey) {
      console.log(`-- SKIPPING ${agentKey}`);
      continue;
    }

    if (!profilesByBrowserKey[browserKey]) profilesByBrowserKey[browserKey] = [];
    const bProfiles = profilesByBrowserKey[browserKey];
    for (const profile of profiles) {
      const matchingProfile = bProfiles.find(x => {
        return (
          equalSupport(x.profile.videoSupport, profile.videoSupport) &&
          equalSupport(x.profile.audioSupport, profile.audioSupport) &&
          equalWebRtcCodecs(x.profile.webRtcVideoCodecs, profile.webRtcVideoCodecs) &&
          equalWebRtcCodecs(x.profile.webRtcAudioCodecs, profile.webRtcAudioCodecs)
        );
      });
      const os = lookup(profile.useragent).os;
      const osString = `${os.family} ${os.major}.${os.minor}`;
      if (!matchingProfile) {
        const entry = {
          profile,
          opSyses: [osString],
        };
        delete entry.profile.useragent;
        bProfiles.push(entry);
      } else {
        if (!matchingProfile.opSyses.includes(osString)) matchingProfile.opSyses.push(osString);
      }
    }
  }

  for (const [browserKey, profile] of Object.entries(profilesByBrowserKey)) {
    const emulationName = browserKey.toLowerCase().replace('_', '-');
    const basePath = emulationsDir + `/emulate-${emulationName}`;
    if (!Fs.existsSync(basePath)) Fs.mkdirSync(basePath, { recursive: true });
    Fs.writeFileSync(basePath + '/codecs.json', JSON.stringify(profile, null, 2));
  }
}

export function equalWebRtcCodecs(a: IWebRTCCodec[], b: IWebRTCCodec[]) {
  if (a.length !== b.length) return false;
  const aMap = [...new Set(a.map(x => x.mimeType ?? (x as any).name))].sort().toString();
  const bMap = [...new Set(b.map(x => x.mimeType ?? (x as any).name))].sort().toString();

  return aMap === bMap;
}

export function equalSupport(a: ICodecSupport, b: ICodecSupport) {
  if (a.maybePlays.toString() !== b.maybePlays.toString()) return false;
  if (a.probablyPlays.toString() !== b.probablyPlays.toString()) return false;
  if (a.recordingFormats.toString() !== b.recordingFormats.toString()) return false;
  return true;
}
