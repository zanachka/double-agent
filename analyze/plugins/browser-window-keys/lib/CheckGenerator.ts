import PathCheck from "@double-agent/analyze/lib/checks/PathCheck";
import IWindowKeysProfile from "@double-agent/collect-browser-window-keys/interfaces/IWindowKeysProfile";

export default class CheckGenerator {
  private readonly profile: IWindowKeysProfile;

  public readonly checks = [];

  constructor(profile: IWindowKeysProfile) {
    this.profile = profile;
    this.extractChecks();
  }

  private extractChecks() {
    const { useragentId } = this.profile;

    for (const key of this.profile.data.keys) {
      const path = `window.${key}`;
      const check = new PathCheck({ useragentId }, path);
      this.checks.push(check);
    }
  }
}
