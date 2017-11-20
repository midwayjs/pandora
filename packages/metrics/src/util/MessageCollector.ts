import {MessageSender} from './MessageSender';
import {MessageConstants} from '../MetricsConstants';
import {LoggerCollector, LoggerOptions} from '../domain';

export class LoggerMessageCollector extends MessageSender implements LoggerCollector {

  private collectMap = {};

  constructor() {
    super();
    this.on(MessageConstants.LOGGER, (data: LoggerOptions) => {
      for (let method in this.collectMap) {
        if (data.method === method) {
          this.collectMap[method].call(this, data);
        }
      }
    });
  }

  collect(method, reply: (payload: LoggerOptions) => void) {
    this.collectMap[method] = reply;
  }

  report(payload) {
    this.send(MessageConstants.LOGGER, payload);
  }

}

export class TraceMessageCollector extends MessageSender {
  collect(reply) {
    this.on(MessageConstants.TRACE, reply);
  }
}
