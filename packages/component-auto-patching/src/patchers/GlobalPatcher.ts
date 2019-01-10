import * as util from 'util';
import * as events from 'events';
import { consoleLogger } from 'pandora-dollar';
import { ErrorLog, ErrorLogManager } from 'pandora-component-error-log';
import { Patcher } from '../Patcher';
import { CURRENT_CONTEXT } from '../constants';
import { GlobalPatcherOptions } from '../domain';

function listenerCount(emitter, evnt) {
  if (emitter.listenerCount) {
    return emitter.listenerCount(evnt);
  }

  return events.EventEmitter.listenerCount(emitter, evnt);
}

export class GlobalPatcher extends Patcher {
  protected options: GlobalPatcherOptions;
  protected _moduleName = 'global';
  protected errorLogManager: ErrorLogManager = this.ctx.errorLogManager;

  _shimmerConsole() {
    const self = this;

    this.shimmer.massWrap(console, ['error', 'warn'], function wrapLog(log, name) {

      return function wrappedLog(this: Console) {
        let args = arguments;
        let err = args[0];

        // 因为已经被 process.unhandledRejection 采集，故不再采集
        if (typeof err === 'string' && err.indexOf('Unhandled promise rejection') > -1) {
          return log.apply(this, arguments);
        }

        try {
          if (!(err instanceof Error)) {
            err = new Error(util.format.apply(util, args));
            err.name = 'Error';
          }

          let traceId = '';
          const context = self.cls.get(CURRENT_CONTEXT);

          if (context) {
            traceId = context.traceId;
          }

          const data: ErrorLog = {
            method: name,
            timestamp: Date.now(),
            errType: err.name,
            message: err.message,
            stack: err.stack,
            traceId,
            path: 'console'
          };

          self.errorLogManager.record(data);
        } catch (err) {
          consoleLogger.error('collect console error failed. ', err);
        }

        return log.apply(this, arguments);
      };
    });
  }

  _shimmerUnhandledRejection() {
    const self = this;

    this.shimmer.wrap(process, 'emit', function wrapProcessEmit(original) {

      return function wrappedProcessEmit(this: NodeJS.Process, event: string, error: Error) {
        if (event === 'unhandledRejection' && error) {
          if (listenerCount(process, 'unhandledRejection') === 0) {
            let traceId = '';

            const context = self.cls.get(CURRENT_CONTEXT);

            if (context) {
              traceId = context.traceId;
            }

            // 在这里采集 unhandledRejection，不在 console.error 里，为了更好的堆栈信息
            const data: ErrorLog = {
              method: 'unhandledRejection',
              timestamp: Date.now(),
              errType: error.name,
              message: error.message,
              stack: error.stack,
              traceId: traceId,
              path: 'unhandledRejection'
            };

            self.errorLogManager.record(data);
          }
        }

        return original.apply(this, arguments);
      };
    });
  }

  _shimmerFatalException() {
    const self = this;

    this.shimmer.wrap(process, '_fatalException', function wrapProcessFatalException(original) {

      return function wrappedProcessFatalException(this: NodeJS.Process, error: Error) {
        let traceId = '';

        const context = self.cls.get(CURRENT_CONTEXT);

        if (context) {
          traceId = context.traceId;
        }

        const data: ErrorLog = {
          method: 'uncaughtException',
          timestamp: Date.now(),
          errType: error.name,
          message: error.message,
          stack: error.stack,
          traceId: traceId,
          path: 'uncaughtException'
        };

        self.errorLogManager.record(data);

        return original.apply(this, arguments);
      };
    });
  }

  attach() {
    const options = this.options;

    if (!options.enabled) return;

    if (!this.errorLogManager) {
      consoleLogger.error('pandora-component-error-log is need.');
      return;
    }

    if (options.recordConsole) {
      this._shimmerConsole();
    }

    if (options.recordUnhandled) {
      this._shimmerUnhandledRejection();
    }

    if (options.recordFatal) {
      this._shimmerFatalException();
    }
  }

}