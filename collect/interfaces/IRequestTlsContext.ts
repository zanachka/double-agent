import IRequestContext from "./IRequestContext";
import http from "http";
import IncomingMessage from "@double-agent/tls-server/lib/IncomingMessage";

export default interface IRequestTlsContext extends IRequestContext {
  req: IncomingMessage & http.IncomingMessage;
}
