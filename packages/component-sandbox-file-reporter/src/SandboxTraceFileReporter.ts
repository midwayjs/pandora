import {IReporter} from 'pandora-component-reporter-manager';
import {FileLoggerManager} from 'pandora-component-file-logger-service';
import {join} from 'path';


export class SandboxTraceFileReporter implements IReporter {
  type = 'trace';
  ctx: any;
  logger: any;
  constructor(ctx: any) {
    this.ctx = ctx;
    const {appName} = ctx;
    const {sandboxFileReporter: config} = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('trace', {
      ...config.trace,
      dir: join(config.logsDir, appName)
    });
  }
  async report (data: any[]): Promise<void> {
    for(const traceData of data) {
      this.logger.write(JSON.stringify(traceData));
    }
  }
}