import ClientHelloProfile from '@double-agent/tls-clienthello/lib/ClientHelloProfile';
import buildJa3Extended from '@double-agent/collect/tls/buildJa3Extended';
import buildJa3 from '@double-agent/collect/tls/buildJa3';

export default async function exportClienthelloProfiles() {
  const profiles = ClientHelloProfile.allProfiles;

  for (const profile of profiles) {
    const ja3 = buildJa3(profile.clientHello);
    const readHello = buildJa3Extended(ja3, profile.clientHello);
    console.log(readHello);
  }
}
