import IDetectionPlugin from '@double-agent/runner/interfaces/IDetectionPlugin';
import IRequestContext from '@double-agent/runner/interfaces/IRequestContext';
import IpProfile from './lib/IpProfile';
import UserBucket from '@double-agent/runner/interfaces/UserBucket';
import { flaggedCheckFromRequest } from '@double-agent/runner/lib/flagUtils';

export default class IpAddressPlugin implements IDetectionPlugin {
  public async onRequest(ctx: IRequestContext) {
    if (ctx.session.requests.length == 1) {
      const ip = ctx.requestDetails.remoteAddress.split(':').shift();
      ctx.session.identifiers.push({
        category: 'IP Address',
        bucket: UserBucket.IP,
        id: ip,
      });

      ctx.session.identifiers.push({
        category: 'IP Address',
        bucket: UserBucket.IpAndPortRange,
        id: ip + ':' + IpProfile.getPortRange(ctx.requestDetails.remoteAddress.split(':').pop()),
      });
      ctx.session.pluginsRun.push(`ip/address`);
    }

    const ips = new Set<string>();
    for (const request of ctx.session.requests) {
      ips.add(request.remoteAddress.split(':').shift());
    }
    const baseFlag = flaggedCheckFromRequest(ctx, 'ip', 'IP Address');
    ctx.session.recordCheck(ips.size > 1, {
      ...baseFlag,
      value: `${ips.size} IPs`,
      expected: '1 IP',
      checkName: 'Same IP for all Requests',
      description: 'Checks that all requests for a session come from the same IP',
      pctBot: 95, // these are all desktop browsers right now
    });

    if (ctx.url.pathname === '/results-page' && ctx.requestDetails.secureDomain === false) {
      const profile = IpProfile.fromContext(ctx);
      profile.save();
    }
  }
}
