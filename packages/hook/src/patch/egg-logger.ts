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
                const data = {
                  time: Date.now(),
                  name: err.name,
                  message: err.message,
                  stack: err.stack,
                  traceId: err.traceId || '',
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
