/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2018 Alibaba Group.
 */

import { Patcher, MessageConstants, MessageSender } from 'pandora-metrics';
import * as util from 'util';
const debug = require('debug')('PandoraHook:Log4js');

export class Log4jsPatcher extends Patcher {

  sender = new MessageSender();

  constructor(options: {
    levelStr?: string | string[],
    levelVal?: number
  } = {
    levelStr: ['WARN', 'ERROR'],
    levelVal: 30000
  }) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'log4js';
  }

  shimmer(options) {
    const self = this;
    const traceManager = this.getTraceManager();

    this.hook('^3.x', (loadModule) => {
      const logger = loadModule('lib/logger.js');

      self.getShimmer().wrap(logger.prototype, '_log', function logWrapper(log) {

        return function wrappedLog(this: any, level, data) {
          let isError = false;

          if (level) {
            if (Array.isArray(options.levelStr)) {
              isError = options.levelStr.indexOf(level.levelStr) > -1;
            } else if (typeof options.levelStr === 'string') {
              isError = options.levelStr === level.levelStr;
            } else {
              isError = level.level >= options.levelVal;
            }
          }

          if (isError) {
            let error = data[0];

            try {
              if (!(error instanceof Error)) {
                error = new Error(util.format.apply(util, data));
                error.name = 'Error';
              }

              const logPath = this.category;
              let traceId = '';

              const tracer = traceManager.getCurrentTracer();
              if (tracer) {
                traceId = tracer.traceId;
              }

              const logData = {
                method: level.levelStr,
                timestamp: Date.now(),
                errType: error.name,
                message: error.message,
                stack: error.stack,
                traceId: traceId,
                path: logPath
              };

              self.sender.send(MessageConstants.LOGGER, logData);
            } catch (err) {
              debug(err);
            }
          }

          return log.apply(this, arguments);
        };

      });
    });
  }
}
