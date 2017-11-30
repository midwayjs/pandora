/**
 * 日志记录指标
 */

import {IBuilder, IndicatorType, LoggerCollector, LoggerOptions} from '../../domain';
import {DuplexIndicator} from '../DuplexIndicator';
import {LoggerMessageCollector} from '../../util/MessageCollector';
import * as address from 'address';
import * as os from 'os';

export class ErrorIndicator extends DuplexIndicator {
  group: string = 'error';
  type: IndicatorType = 'multiton';
  collector: LoggerCollector;
  ip: string = address.ip();
  host: string  = os.hostname();

  constructor(collector = new LoggerMessageCollector()) {
    super();
    this.collector = collector;
  }

  registerUplink() {
    this.collector.collect('error', (payload: LoggerOptions) => {
      if('error' === payload.method) {
        this.report(Object.assign({
          date: Date.now(),
          appName: this.getAppName(),
          ip: this.ip,
          host: this.host,
          pid: process.pid
        }, payload));
      }
    });
  }

  async invoke(data: any, builder: IBuilder) {

  }

}
