
import * as util from 'util';
import { ErrorLog } from 'pandora-component-error-log';
import { EggLoggerPatcherOptions } from '../domain';
import { CURRENT_CONTEXT } from '../constants';
import { Patcher } from '../Patcher';

export class EggLoggerPatcher extends Patcher {

  protected _moduleName = 'egg-logger';
  protected options: EggLoggerPatcherOptions;
  protected eggLoggerModule = null;

  target() {
    return 'egg-logger';
  }

  attach() {
    const target = this.target();

    this.hook(target, '^2.x||^1.6.x', (loadModule) => {
      const self = this;
      const logger = loadModule('lib/logger.js');
      this.eggLoggerModule = logger;

      this.shimmer.wrap(logger.prototype, 'log', function logWrapper(log) {

        return function wrappedLog(this: any, level, args, meta) {
          const _level = (level || '').toLowerCase();

          if (_level === 'error' || _level === 'warn') {

            let error = args[0];

            try {
              if (!(error instanceof Error)) {
                error = new Error(util.format.apply(util, args));
                error.name = 'Error';
              }

              let logPath = 'egg-logger';
              const fileTrans = this.get('file');
              if (fileTrans) {
                logPath = fileTrans.options.file;
              }

              let traceId = '';
              const context = self.cls.get(CURRENT_CONTEXT);
              if (context && context.traceId) {
                traceId = context.traceId;
              }

              const data: ErrorLog = {
                method: _level,
                timestamp: Date.now(),
                errType: error.name,
                message: error.message,
                stack: error.stack,
                traceId: traceId,
                path: logPath,
              };
              self.ctx.errorLogManager.record(data);
            } catch (err) {
              self.logger.error('Error during errorLogManager.record()', err);
            }
          }

          return log.apply(this, arguments);
        };
      });
    });

  }

  unattach() {
    if (this.eggLoggerModule) {
      this.shimmer.unwrap(this.eggLoggerModule.prototype, 'log');
    }
  }

}
