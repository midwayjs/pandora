import {MessengerSender} from './MessengerSender';
import {MessageConstants} from '../MetricsConstants';

export class LoggerMessageCollector extends MessengerSender {

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

  collect(method, reply: (data) => {}) {
    this.collectMap[method] = reply;
  }

}
