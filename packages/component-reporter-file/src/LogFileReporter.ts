import { FileLoggerManager } from '@pandorajs/component-file-logger-service';
import { LogExporter, LogRecord } from '@pandorajs/component-logger';

export class LogFileReporter implements LogExporter {
  type = 'errorLog';
  logger: any;

  constructor(private ctx: any) {
    const { reporterFile: config } = ctx.config;
    const fileLoggerManager: FileLoggerManager = ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('pandora-errors', {
      ...config.error,
      dir: config.logsDir,
    });
  }

  export(data: LogRecord[]) {
    const globalTags = this.getGlobalTags();
    for (const errorLog of data) {
      let level = 'NONE';
      if (errorLog.level) {
        level = errorLog.level.toUpperCase();
      }
      this.logger.log(
        level,
        [
          JSON.stringify({
            ...errorLog,
            ...globalTags,
          }),
        ],
        { raw: true }
      );
    }
  }

  getGlobalTags() {
    const { reporterFile: config } = this.ctx.config;
    return config.globalTags;
  }
}
