'use strict';
import { Patcher, MessageConstants, MessageSender } from 'pandora-metrics';
const util = require('util');

export class EggLoggerPatcher extends Patcher {

  sender = new MessageSender();

  constructor(options = {}) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'egg-logger';
  }

  shimmer(options) {
    const self = this;
    const traceManager = this.getTraceManager();

    this.hook('^1.6.x', (loadModule) => {
      const logger = loadModule('lib/logger.js');

      self.getShimmer().massWrap(logger.prototype, ['error', 'warn'], function wrapLog(log, name) {
        return function wrappedLog(this: any) {
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
                traceId = tracer.getAttrValue('traceId');
              }
              const data = {
                method: name,
                timestamp: Date.now(),
                errType: err.name,
                message: err.message,
                stack: err.stack,
                traceId: traceId,
                path: logPath
              };
              self.sender.send(MessageConstants.LOGGER, data);
            } catch (err) {
              console.error(err);
            }
          });

          return log.apply(this, arguments);
        };
      });
    });
  }
}
