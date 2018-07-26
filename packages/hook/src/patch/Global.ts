
import { Patcher, MessageConstants, MessageSender } from 'pandora-metrics';
import * as util from 'util';
import * as events from 'events';
const debug = require('debug')('PandoraHook:Global');

function listenerCount(emitter, evnt) {
  if (emitter.listenerCount) {
    return emitter.listenerCount(evnt);
  }

  return events.EventEmitter.listenerCount(emitter, evnt);
}

export class GlobalPatcher extends Patcher {

  sender = new MessageSender();

  constructor(options) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'global';
  }

  _shimmerConsole() {
    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().massWrap(console, ['error', 'warn'], function wrapLog(log, name) {
      return function wrappedLog(this: NodeJS.ConsoleConstructor) {
        let args = arguments;
        let err = args[0];

        // 因为已经被 process.unhandledRejection 采集，故不再采集
        if (typeof err === 'string' && err.indexOf('Unhandled promise rejection') > -1) {
          return;
        }

        try {
          if (!(err instanceof Error)) {
            err = new Error(util.format.apply(util, args));
            err.name = 'Error';
          }

          let traceId = '';
          const tracer = traceManager.getCurrentTracer();
          if (tracer) {
            traceId = tracer.traceId;
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

          self.sender.send(MessageConstants.LOGGER, data);
        } catch (err) {
          debug('collect console error failed. ', err);
        }

        return log.apply(this, arguments);
      };
    });
  }

  _shimmerUnhandledRejection() {
    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().wrap(process, 'emit', function wrapProcessEmit(original) {

      return function wrappedProcessEmit(this: NodeJS.Process, event, error) {
        if (event === 'unhandledRejection' && error) {
          if (listenerCount(process, 'unhandledRejection') === 0) {
            let traceId = '';
            const tracer = traceManager.getCurrentTracer();
            if (tracer) {
              traceId = tracer.traceId;
            }

            // 在这里采集 unhandledRejection，不在 console.error 里，为了更好的堆栈信息
            const data = {
              method: 'unhandledRejection',
              timestamp: Date.now(),
              errType: error.name,
              message: error.message,
              stack: error.stack,
              traceId: traceId,
              path: 'unhandledRejection'
            };

            self.sender.send(MessageConstants.LOGGER, data);
          }
        }

        return original.apply(this, arguments);
      };
    });
  }

  _shimmerFatalException() {
    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().wrap(process, '_fatalException', function wrapProcessFatalException(original) {

      return function wrappedProcessFatalException(this: NodeJS.Process, error) {
        let traceId = '';
        const tracer = traceManager.getCurrentTracer();
        if (tracer) {
          traceId = tracer.traceId;
        }

        const data = {
          method: 'uncaughtException',
          timestamp: Date.now(),
          errType: error.name,
          message: error.message,
          stack: error.stack,
          traceId: traceId,
          path: 'uncaughtException'
        };

        self.sender.send(MessageConstants.LOGGER, data);

        return original.apply(this, arguments);
      };
    });
  }

  shimmer(options) {
    this._shimmerConsole();
    this._shimmerUnhandledRejection();
    this._shimmerFatalException();
  }
}