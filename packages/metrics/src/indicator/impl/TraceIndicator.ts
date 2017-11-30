import {IBuilder, IndicatorType} from '../../domain';
import {TraceManager} from '../../trace/TraceManager';
import {DuplexIndicator} from '../DuplexIndicator';
import {TraceMessageCollector} from '../../util/MessageCollector';
import * as address from 'address';
import * as os from 'os';

export class TraceIndicator extends DuplexIndicator {

  group: string = 'trace';
  type: IndicatorType = 'multiton';
  private traceManager = TraceManager.getInstance();
  private collector;
  ip: string = address.ip();
  host: string = os.hostname();

  constructor(collector = new TraceMessageCollector()) {
    super();
    this.collector = collector;
  }

  async invoke(data: any, builder: IBuilder) {

  }

  registerUplink() {
    this.collector.collect(data => {
      this.report(Object.assign({
        date: Date.now(),
        appName: this.getAppName(),
        pid: process.pid,
        ip: this.ip,
        host: this.host
      }, data));
    });
  }

  getTraceManager() {
    return this.traceManager;
  }

}
