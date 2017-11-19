/**
 * 日志记录指标
 */

import {IBuilder, IndicatorType, LoggerCollector, LoggerOptions} from '../../domain';
import {DuplexIndicator} from '../DuplexIndicator';
import {LoggerMessageCollector} from '../../util/LoggerMessageCollector';
const util = require('util');

function getDate() {
  let d = new Date();
  return util.format(
    '%s-%s-%s %s:%s:%s',
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds()
  );
}

export class ErrorIndicator extends DuplexIndicator {
  group: string = 'error';
  type: IndicatorType = 'multiton';
  collector: LoggerCollector;

  constructor(collector = new LoggerMessageCollector()) {
    super();
    this.collector = collector;
  }

  registerUplink() {
    this.collector.collect('error', (payload: LoggerOptions) => {
      if('error' === payload.method) {
        this.report(Object.assign(payload, {
          date: getDate(),
          appName: this.getAppName()
        }));
      }
    });
  }

  async invoke(data: any, builder: IBuilder) {

  }

}
