import {IReporter} from 'pandora-component-reporter-manager';
import {FileLoggerManager} from 'pandora-component-file-logger-service';
import {join} from 'path';
import {FileReporterUtil} from './FileReporterUtil';

export class SandboxErrorLogFileReporter implements IReporter {
  type = 'errorLog';
  ctx: any;
  logger: any;
  constructor(ctx: any) {
    this.ctx = ctx;
    const {appName} = ctx;
    const {sandboxFileReporter: config} = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('sandbox-errors', {
      ...config.error,
      dir: join(config.logsDir, appName)
    });
  }
  async report (data: any[]): Promise<void> {
    const globalTags = this.getGlobalTags();
    for(const errorLog of data) {
      let level = 'NONE';
      if (errorLog.method) {
        level = errorLog.method.toUpperCase();
      }
      this.logger.log(level, [JSON.stringify({
        ...errorLog,
        unix_timestamp: FileReporterUtil.unix(errorLog.timestamp),
        ...globalTags
      })], { raw: true });
    }
  }
  getGlobalTags() {
    const {sandboxFileReporter: config} = this.ctx.config;
    return config.globalTags;
  }
}