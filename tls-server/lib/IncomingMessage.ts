import {IncomingHttpHeaders} from "http";
import ITlsResult from "../interfaces/ITlsResult";
import {IClientHello} from "./parseHelloMessage";

export default class IncomingMessage implements ITlsResult {
  readonly hasGrease?: boolean;
  readonly reason?: string;
  readonly ja3Extended?: string;
  readonly ja3ExtendedMd5?: string;
  readonly ja3?: string;
  readonly ja3Md5?: string;
  readonly ja3MatchFor?: string[];
  readonly ja3erMatchFor?: string;
  readonly clientHello?: IClientHello;

  readonly connectionId: string;
  readonly connection: {
    remoteAddress?: string;
    remotePort?: number;
  };
  readonly url?: string;
  readonly method?: string;
  readonly headers: IncomingHttpHeaders;
  readonly rawHeaders: string[];
  readonly alpnProtocol?: string;
  readonly cipherName: string;
  readonly tlsProtocol: string | null;

  constructor(data: IncomingMessage) {
    Object.assign(this, data);
  }

  [Symbol.asyncIterator]() {
    return {
      i: 0,
      next() {
        return Promise.resolve({ done: true });
      }
    };
  }
}
