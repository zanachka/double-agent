import IRequestContext from "./IRequestContext";
import ITlsResult from "@double-agent/tls-server/interfaces/ITlsResult";
import {IncomingMessage} from "http";

export default interface IRequestTlsContext extends IRequestContext {
  req: IncomingMessage & ITlsResult;
}
