import {MessengerSender} from './MessengerSender';
import {MessageConstants} from '../MetricsConstants';
import {LoggerCollector, LoggerOptions} from '../domain';

export class LoggerMessageCollector extends MessengerSender implements LoggerCollector {

  private collectMap = {};

  constructor() {
    super();
    this.on(MessageConstants.LOGGER, (data: {
      method,
      args
    }) => {
      for (let method in this.collectMap) {
        if (data.method === method) {
          this.collectMap[method].call(this, data);
        }
      }
    });
  }

  collect(method, reply: (payload: LoggerOptions) => {}) {
    this.collectMap[method] = reply;
  }

  report(payload) {
    this.send(MessageConstants.LOGGER, payload);
  }

}
