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
      const traceData2nd = {...traceData};
      if(traceData.spans) {
        traceData2nd.spans = [];
        for(const span of traceData.spans) {
          if(span.toJSON) {
            // 如果 span 有 toJSON 接口，则使用 toJSON 接口获得序列化对象
            traceData2nd.spans.push(span.toJSON());
          } else {
            traceData2nd.spans.push(span);
          }
        }
      }
      this.logger.write(JSON.stringify({
        ...traceData2nd,
        ...this.getGlobalTags()
      }));
    }
  }
  getGlobalTags() {
    const {sandboxFileReporter: config} = this.ctx.config;
    return config.globalTags;
  }
}