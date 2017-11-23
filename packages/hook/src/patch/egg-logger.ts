'use strict';
import {Patcher, MessageConstants} from 'pandora-metrics';

export class EggLoggerPatcher extends Patcher {

  constructor() {
    super();

    const self = this;
    this.hook('^1.6.x', (loadModule) => {
      const logger = loadModule('lib/logger.js');
      ['info', 'error', 'warn'].forEach(method => {
        self.getShimmer().wrap(logger.prototype, method, (log) => {
          return function () {
            process.nextTick(() => {
              self.getSender().send(MessageConstants.LOGGER, {
                method,
                args: arguments
              });
            });
            return log.apply(this, arguments);
          };
        });
      });
    });
  }

  getModuleName() {
    return 'egg-logger';
  }
}
