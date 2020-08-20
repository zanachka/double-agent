import EventEmitter from 'events';
import { ChildProcess, fork } from 'child_process';
import ITlsResult from './interfaces/ITlsResult';
import { IClientHello } from './lib/parseHelloMessage';
import parseTlsRecordFromStderr from './lib/parseTlsRecordFromStderr';
import buildJa3 from './lib/buildJa3';
import buildJa3Extended, {isGreased} from './lib/buildJa3Extended';
import ja3er from './lib/ja3er';
import ServerResponse from './lib/ServerResponse';
import IncomingMessage from "./lib/IncomingMessage";

export default class TlsServer extends EventEmitter {
  private child: ChildProcess;
  private port: number;
  private openSslOutput: string;
  private activeRequest: { https?: any, tls?: ITlsResult, isProcessing?: boolean } = {};
  private listenCallback: () => void;

  private readonly options: any;
  private readonly secureConnectionListener: any;

  constructor(options: any, secureConnectionListener) {
    super();
    this.options = options;
    this.secureConnectionListener = secureConnectionListener;
  }

  public listen(port: number, callback?: () => void) {
    this.port = port;
    this.listenCallback = callback;

    this.child = fork(__dirname + '/child', [], { stdio: ['ignore', 'inherit', 'pipe', 'ipc'] });
    this.child.stderr.setEncoding('utf8');

    this.child.on('error', err => {
      console.log('ERROR from tls child process', err);
      this.emit('error', err);
    });

    this.child.on('message', this.handleChildMessage.bind(this));
    this.child.stderr.on('data', this.handleOpenSslOutput.bind(this));

    this.child.send({
      start: { ...this.options, port }
    });
  }

  public close() {
    this.child.kill();
  }

  private emitRequest() {
    if (!this.activeRequest) return;
    if (!this.activeRequest.https) return;
    if (!this.activeRequest.tls) return;
    if (this.activeRequest.isProcessing) return;
    this.activeRequest.isProcessing = true;

    const req = new IncomingMessage({ ...this.activeRequest.https, ...this.activeRequest.tls });
    const res = new ServerResponse(this.child, req);
    this.secureConnectionListener(req, res);
  }

  private handleChildMessage(message: any) {
    if (message.started) {
      if (this.listenCallback) this.listenCallback();
      return;
    }

    if (message.error) {
      this.emitError(message.error);
      return;
    }

    if (message.reset) {
      this.activeRequest = {};
      this.openSslOutput = '';
      return;
    }


    if (message.overloaded) {
      this.emit('overloaded');
      return;
    }

    if (message.favicon) {
      return;
    }

    if (message.request) {
      if (this.activeRequest.https) {
        return this.emitError('Found a conflicting https request');
      }
      this.activeRequest.https = message.request;
      this.emitRequest();
    }
  }

  private handleOpenSslOutput(message: string) {
    if (this.activeRequest.isProcessing) return;
    if (process.env.PRINT_RAW) console.log('\n------RAW------\n%s\n\n', message);
    this.openSslOutput += message;
    const messages = this.openSslOutput.split('\n\n');
    this.openSslOutput = messages.pop();
    for (const str of messages) {
      try {
        let message = parseTlsRecordFromStderr(str);
        if ((message.header.content as any)?.type === 'ClientHello') {
          const clienthello = message.header.content as IClientHello;
          const ja3Details = buildJa3(clienthello);
          const ja3Extended = buildJa3Extended(ja3Details, clienthello);
          const ja3erStats = ja3er(ja3Details.md5);
          const alsoSeenOn = `TLS fingerprint seen ${ja3erStats.count} times on Ja3er crowdsourced tool, but no confirmations`;
          const alsoSeenOnBrowsers = [...ja3erStats.browsers.entries()].map(
              ([key, val]) => `${key}: ${val.join(', ')}`,
          );

          if (this.activeRequest.tls) {
            return; //this.emitError('Found a conflicting tls request');
          }

          this.activeRequest.tls = {
            hasGrease: isGreased(ja3Extended.value),
            ja3: ja3Details.value,
            ja3Md5: ja3Details.md5,
            ja3Extended: ja3Extended.value,
            ja3ExtendedMd5: ja3Extended.md5,
            ja3erMatchFor: `${alsoSeenOn} (${alsoSeenOnBrowsers.join(', ')})`,
            ja3MatchFor: [],
            clientHello: clienthello,
          };
          this.emitRequest();
        }
      } catch (err) {
        console.log(err);
        this.emitError(err.message);
      }
    }
  }

  private emitError(message: string) {
    this.emit('error', message);
    console.log(`ERROR: ${message}`);
  }

  static createServer(options, secureConnectionListener) {
    return new TlsServer(options, secureConnectionListener);
  }
}

