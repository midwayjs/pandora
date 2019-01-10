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
      this.logger.write(JSON.stringify({
        ...errorLog,
        unix_timestamp: FileReporterUtil.unix(errorLog.timestamp),
        seed: FileReporterUtil.getSeed(),
        ...globalTags
      }));
    }
  }
  getGlobalTags() {
    const {sandboxFileReporter: config} = this.ctx.config;
    return config.globalTags;
  }
}