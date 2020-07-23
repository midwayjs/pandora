import { FileLoggerManager } from '@pandorajs/component-file-logger-service';
import { MetricExporter, MetricRecord } from '@opentelemetry/metrics';
import { ExportResult } from '@opentelemetry/core';

export class MetricsFileReporter implements MetricExporter {
  type = 'metrics';
  logger: any;
  constructor(private ctx: any) {
    const { reporterFile: config } = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('pandora-metrics', {
      ...config.metrics,
      dir: config.logsDir,
    });
  }
  export(data: MetricRecord[], callback) {
    const globalTags = this.getGlobalTags();
    const timestamp = Date.now();
    for (const record of data) {
      const point = record.aggregator.toPoint();
      if (point.value == null) {
        // TODO: it is possible when value recorder doesn't get updated with values.
        continue;
      }
      if (typeof point.value === 'number') {
        this.logger.log(
          'INFO',
          [
            JSON.stringify({
              metric: record.descriptor.name,
              timestamp,
              value: point.value,
              tags: {
                ...record.labels,
                ...globalTags,
              },
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
            metric: record.descriptor.name + '_count',
            timestamp,
            value: point.value.count,
            tags: {
              ...record.labels,
              ...globalTags,
            },
          }),
        ],
        { raw: true }
      );
      this.logger.log(
        'INFO',
        [
          JSON.stringify({
            metric: record.descriptor.name + '_sum',
            timestamp,
            value: point.value.sum,
            tags: {
              ...record.labels,
              ...globalTags,
            },
          }),
        ],
        { raw: true }
      );
      // TODO: distribution and histogram support
    }
    callback(ExportResult.SUCCESS);
  }

  shutdown() {}

  getGlobalTags() {
    const { reporterFile: config } = this.ctx.config;
    return config.globalTags;
  }
}
