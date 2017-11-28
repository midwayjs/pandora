import {IBuilder, IndicatorType} from '../../domain';
import {TraceManager} from '../../trace/TraceManager';
import {DuplexIndicator} from '../DuplexIndicator';
import {TraceMessageCollector} from '../../util/MessageCollector';

export class TraceIndicator extends DuplexIndicator {

  group: string = 'trace';
  type: IndicatorType = 'multiton';
  private traceManager = TraceManager.getInstance();
  private collector;

  constructor(collector = new TraceMessageCollector()) {
    super();
    this.collector = collector;
  }

  async invoke(data: any, builder: IBuilder) {

  }

  registerUplink() {
    this.collector.collect(data => {
      this.report(Object.assign(data, {
        appName: this.getAppName(),
        pid: process.pid
      }));
    });
  }

  getTraceManager() {
    return this.traceManager;
  }

}
