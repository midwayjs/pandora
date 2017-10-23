/**
 * 日志记录指标
 */

import {IBuilder, IndicatorType, LoggerOptions} from '../../domain';
import {DuplexIndicator} from '../DuplexIndicator';
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
  loggerMannager: any;
  type: IndicatorType = 'multiton';

  constructor(loggerMannager) {
    super();
    this.loggerMannager = loggerMannager;
  }

  registerUplink() {
    this.loggerMannager.on('message', (payload: LoggerOptions) => {
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
