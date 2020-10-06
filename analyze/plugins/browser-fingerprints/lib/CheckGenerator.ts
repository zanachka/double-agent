import IFingerprintProfile from "@double-agent/collect-browser-fingerprints/interfaces/IFingerprintProfile";
import SessionFingerprintCheck from "./checks/SessionFingerprintCheck";
import UniqueFingerprintCheck from "./checks/UniqueFingerprintCheck";

export default class CheckGenerator {
  private readonly profile: IFingerprintProfile;

  public readonly checks = [];

  constructor(profile: IFingerprintProfile) {
    this.profile = profile;
    this.extractChecks();
  }

  private extractChecks() {
    const { useragentId } = this.profile;

    const fingerprints = this.profile.data.map(x => x.browserHash);
    this.checks.push(new SessionFingerprintCheck({ useragentId }, 'fingerprint-js', fingerprints));
    this.checks.push(new UniqueFingerprintCheck({ isUniversal: true }, 'fingerprint-js', fingerprints[0]));
  }
}
