/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import {getPandoraConsoleLogger} from 'pandora-dollar';
const pandoraConsoleLogger = getPandoraConsoleLogger();
import { Patcher, MessageConstants } from 'pandora-metrics';
import * as util from 'util';

export class GlobalPatcher extends Patcher {

  constructor() {
    super();

    this.shimmer();
  }

  _shimmerConsole() {
    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().massWrap(console, ['log', 'info', 'warn', 'error'], function wrapLog(log, name) {
      return function wrappedLog() {
        process.nextTick(() => {
          let args = arguments;
          let err = args[0];

          try {
            if (!(err instanceof Error)) {
              err = new Error(util.format.apply(util, args));
              err.name = 'Error';
            }

            let traceId = '';
            const tracer = traceManager.getCurrentTracer();
            if (tracer) {
              traceId = tracer.getAttrValue('traceId');
            }

            const data = {
              method: name,
              timestamp: Date.now(),
              errType: err.name,
              message: err.message,
              stack: err.stack,
              traceId: traceId,
              path: 'console'
            };

            self.getSender().send(MessageConstants.LOGGER, data);
          } catch (err) {
            pandoraConsoleLogger.error(err);
          }
        });

        return log.apply(this, arguments);
      };
    });
  }

  shimmer() {
    this._shimmerConsole();
  }
}