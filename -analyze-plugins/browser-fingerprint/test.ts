import {
  browserIgnoredAttributes,
  sessionIgnoredAttributes
} from "@double-agent/collect-browser-fingerprints/fingerprintScript";

ctx.session.addIdentifier({
  id: profile.browserHash,
  type: 'Browser',
  pluginName: this.id,
  description: `Calculates a hash from browser attributes in fingerprint2 that should stay the same regardless of user agent (excludes: ${browserIgnoredAttributes})`,
});

ctx.session.addIdentifier({
  id: profile.sessionHash,
  type: 'BrowserSingleSession',
  pluginName: this.id,
  description: `Calculates a hash from browser attributes in fingerprint2 that should stay the same during a single user session (excludes: ${sessionIgnoredAttributes})`,
});
