'use strict';
import { Patcher, MessageConstants, MessageSender } from 'pandora-metrics';
import * as util from 'util';
const debug = require('debug')('PandoraHook:EggLogger');

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

      self.getShimmer().wrap(logger.prototype, 'log', function logWrapper(log) {

        return function wrappedLog(this: any, level, args, meta) {
          const _level = (level || '').toLowerCase();

          if (_level === 'error' || _level === 'warn') {

            process.nextTick(() => {
              let error = args[0];

              try {
                if (!(error instanceof Error)) {
                  error = new Error(util.format.apply(util, args));
                  error.name = 'Error';
                }

                let logPath = 'console';
                let traceId = '';

                const fileTrans = this.get('file');
                if (fileTrans) {
                  logPath = fileTrans.options.file;
                }

                const tracer = traceManager.getCurrentTracer();
                if (tracer) {
                  traceId = tracer.getAttrValue('traceId');
                }

                const data = {
                  method: _level,
                  timestamp: Date.now(),
                  errType: error.name,
                  message: error.message,
                  stack: error.stack,
                  traceId: traceId,
                  path: logPath
                };

                self.sender.send(MessageConstants.LOGGER, data);
              } catch (err) {
                debug(err);
              }
            });
          }

          return log.apply(this, arguments);
        };

      });
    });
  }
}
