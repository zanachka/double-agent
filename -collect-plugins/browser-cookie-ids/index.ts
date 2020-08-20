import HostDomain from "@double-agent/collect/interfaces/HostDomain";
import {v1} from "uuid";
import UserBucket from "@double-agent/collect/interfaces/UserBucket";

if (!session.userUuid && requestDetails.domainType !== HostDomain.External) {
  session.userUuid = cookies['uuid'];
  if (!session.userUuid) {
    session.userUuid = v1();
    requestDetails.setCookies.push(
        `uuid=${session.userUuid}; Secure; SameSite=None; HttpOnly;`,
    );
  }
  session.identifiers.push({
    bucket: UserBucket.UserCookie,
    id: session.userUuid,
    description: 'A distinct cookie set per user',
    category: 'Cookie Support'
  });
}
