import {IBuilder, IndicatorType} from '../../domain';
import {TraceManager} from '../../trace/TraceManager';
import {MessengerSender} from '../../util/MessengerSender';
import {MessageConstants} from '../../MetricsConstants';
import {DuplexIndicator} from '../DuplexIndicator';

class TraceMessengerCollector extends MessengerSender {
  collect(reply) {
    this.on(MessageConstants.TRACE, reply);
  }
}

export class TraceIndicator extends DuplexIndicator {

  group: string = 'trace';
  type: IndicatorType = 'multiton';
  private traceManager = TraceManager.getInstance();
  collector;

  constructor() {
    super();
    this.collector = new TraceMessengerCollector();
    this.collector.on();
  }

  async invoke(data: any, builder: IBuilder) {

  }

  registerUplink() {
    this.collector.collect(data => {
      this.report(Object.assign(data, {
        date: getDate(),
        appName: this.getAppName()
      }));
    });
  }

  getTraceManager() {
    return this.traceManager;
  }

}
