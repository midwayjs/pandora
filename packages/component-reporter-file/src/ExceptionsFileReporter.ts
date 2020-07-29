import { FileLoggerManager } from '@pandorajs/component-file-logger-service';
import {
  ExceptionExporter,
  ExceptionRecord,
} from '@pandorajs/component-logger';
import { Resource } from '@opentelemetry/resources';

export class ExceptionsFileReporter implements ExceptionExporter {
  type = 'errorLog';
  logger: any;
  resource: Resource;

  constructor(private ctx: any) {
    this.resource = ctx.resource;
    const { reporterFile: config } = ctx.config;
    const fileLoggerManager: FileLoggerManager = ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('pandora-exceptions', {
      ...config.exceptions,
      dir: config.logsDir,
    });
  }

  export(data: ExceptionRecord[]) {
    for (const record of data) {
      let level = 'NONE';
      if (record.level) {
        level = record.level.toUpperCase();
      }
      this.logger.log(
        level,
        [
          JSON.stringify({
            timestamp: record.timestamp,
            level: record.level,
            traceId: record.traceId,
            spanId: record.spanId,
            traceName: record.traceName,
            resource: record.resource,
            name: record.name,
            message: record.message,
            stack: record.stack,
            attributes: {
              ...record?.attributes,
              ...record?.resource.labels,
            },
            path: record.path,
          }),
        ],
        { raw: true }
      );
    }
  }
}
