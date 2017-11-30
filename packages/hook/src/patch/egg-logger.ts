'use strict';
import { Patcher, MessageConstants } from 'pandora-metrics';
const util = require('util');

export class EggLoggerPatcher extends Patcher {

  constructor() {
    super();

    this.shimmer();
  }

  getModuleName() {
    return 'egg-logger';
  }

  shimmer() {
    const self = this;
    const traceManager = this.getTraceManager();

    this.hook('^1.6.x', (loadModule) => {
      const logger = loadModule('lib/logger.js');
      ['info', 'error', 'warn'].forEach(method => {
        self.getShimmer().wrap(logger.prototype, method, function wrapLog(log) {
          return function wrappedLog() {
            let args = arguments;
            process.nextTick(() => {
              let err = args[0];

              try {
                if (!(err instanceof Error)) {
                  err = new Error(util.format.apply(util, args));
                  err.name = 'Error';
                }
                let logPath = '';
                let traceId = '';
                const file = this.get('file');
                if (file) {
                  logPath = file.options.file;
                }
                const tracer = traceManager.getCurrentTracer();
                if (tracer) {
                  traceId = tracer.getAttr('traceId');
                }
                const data = {
                  method,
                  date: Date.now(),
                  errType: err.name,
                  message: err.message,
                  stack: err.stack,
                  traceId: traceId,
                  path: logPath
                };
                self.getSender().send(MessageConstants.LOGGER, data);
              } catch (err) {
                console.error(err);
              }
            });

            return log.apply(this, arguments);
          };
        });
      });
    });
  }
}
