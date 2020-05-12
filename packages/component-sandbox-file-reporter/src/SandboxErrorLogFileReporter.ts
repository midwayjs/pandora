import { FileLoggerManager } from '@pandorajs/component-file-logger-service';
import { FileReporterUtil } from './FileReporterUtil';

export class SandboxErrorLogFileReporter {
  type = 'errorLog';
  logger: any;
  constructor(private ctx: any) {
    const { sandboxFileReporter: config } = ctx.config;
    const fileLoggerManager: FileLoggerManager = ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('sandbox-errors', {
      ...config.error,
      dir: config.logsDir,
    });
  }
  async report(data: any[]): Promise<void> {
    const globalTags = this.getGlobalTags();
    for (const errorLog of data) {
      let level = 'NONE';
      if (errorLog.method) {
        level = errorLog.method.toUpperCase();
      }
      this.logger.log(
        level,
        [
          JSON.stringify({
            ...errorLog,
            unix_timestamp: FileReporterUtil.unix(errorLog.timestamp),
            ...globalTags,
          }),
        ],
        { raw: true }
      );
    }
  }
  getGlobalTags() {
    const { sandboxFileReporter: config } = this.ctx.config;
    return config.globalTags;
  }
}
