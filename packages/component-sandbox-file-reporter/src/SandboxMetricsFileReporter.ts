import { IMetricSnapshot } from '@pandorajs/component-metrics';
import { FileLoggerManager } from '@pandorajs/component-file-logger-service';
import { hrTimeToMilliseconds } from './util';

export class SandboxMetricsFileReporter {
  type = 'metrics';
  logger: any;
  constructor(private ctx: any) {
    const { sandboxFileReporter: config } = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('sandbox-metrics', {
      ...config.metrics,
      dir: config.logsDir,
    });
  }
  async report(data: IMetricSnapshot[]): Promise<void> {
    const globalTags = this.getGlobalTags();
    for (const metricObject of data) {
      const timestamp = hrTimeToMilliseconds(metricObject.point.timestamp);
      if (typeof metricObject.point.value === 'number') {
        this.logger.log(
          'INFO',
          [
            JSON.stringify({
              metric: metricObject.descriptor.name,
              timestamp,
              value: metricObject.point.value,
              tags: {
                ...metricObject.labels,
                ...globalTags,
              },
              unix_timestamp: metricObject.point.timestamp[0],
            }),
          ],
          { raw: true }
        );
        continue;
      }
      this.logger.log(
        'INFO',
        [
          JSON.stringify({
            metric: metricObject.descriptor.name + '_count',
            timestamp,
            value: metricObject.point.value.count,
            tags: {
              ...metricObject.labels,
              ...globalTags,
            },
            unix_timestamp: metricObject.point.timestamp[0],
          }),
        ],
        { raw: true }
      );
      this.logger.log(
        'INFO',
        [
          JSON.stringify({
            metric: metricObject.descriptor.name + '_sum',
            timestamp,
            value: metricObject.point.value.sum,
            tags: {
              ...metricObject.labels,
              ...globalTags,
            },
            unix_timestamp: metricObject.point.timestamp[0],
          }),
        ],
        { raw: true }
      );
      // TODO: distribution and histogram support
    }
  }
  getGlobalTags() {
    const { sandboxFileReporter: config } = this.ctx.config;
    return config.globalTags;
  }
}
