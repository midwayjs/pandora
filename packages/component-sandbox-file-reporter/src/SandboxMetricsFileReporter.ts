import { IMetricSnapshot } from 'pandora-component-metrics';
import {FileLoggerManager} from 'pandora-component-file-logger-service';
import {join} from 'path';
import {FileReporterUtil} from './FileReporterUtil';


export class SandboxMetricsFileReporter {
  type = 'metrics';
  ctx: any;
  logger: any;
  constructor(ctx: any) {
    this.ctx = ctx;
    const {appName} = ctx;
    const {sandboxFileReporter: config} = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('sandbox-metrics', {
      ...config.metrics,
      dir: join(config.logsDir, appName)
    });
  }
  async report (data: IMetricSnapshot[]): Promise<void> {
    const globalTags = this.getGlobalTags();
    for(const metricObject of data) {
      const timestamp = hrTimeToTimestamp(metricObject.point.timestamp)
      if (typeof metricObject.point.value === 'number') {
        this.logger.log('INFO', [JSON.stringify({
          metric: metricObject.descriptor.name,
          timestamp,
          value: metricObject.point.value,
          tags: {
            ...metricObject.labels,
            ...globalTags
          },
          unix_timestamp: metricObject.point.timestamp[0],
        })], { raw: true });
        continue
      }
      this.logger.log('INFO', [JSON.stringify({
        metric: metricObject.descriptor.name + '_count',
        timestamp,
        value: metricObject.point.value.count,
        tags: {
          ...metricObject.labels,
          ...globalTags
        },
        unix_timestamp: metricObject.point.timestamp[0],
      })], { raw: true });
      this.logger.log('INFO', [JSON.stringify({
        metric: metricObject.descriptor.name + '_sum',
        timestamp,
        value: metricObject.point.value.sum,
        tags: {
          ...metricObject.labels,
          ...globalTags
        },
        unix_timestamp: metricObject.point.timestamp[0],
      })], { raw: true });
      // TODO: distribution and histogram support
    }
  }
  getGlobalTags() {
    const {sandboxFileReporter: config} = this.ctx.config;
    return config.globalTags;
  }
}

function hrTimeToTimestamp (hrtime) {
  return hrtime[0] * 1000 + Math.floor(hrtime[1] / 1e6)
}
