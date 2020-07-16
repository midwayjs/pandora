import {
  FileLoggerManager,
  ILogger,
} from '@pandorajs/component-file-logger-service';
import * as tracing from '@opentelemetry/tracing';
import { hrTimeToMilliseconds } from './util';

export class TracesFileReporter implements tracing.SpanExporter {
  type = 'trace';
  logger: ILogger;
  constructor(private ctx: any) {
    const { reporterFile: config } = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('pandora-traces', {
      ...config.traces,
      dir: config.logsDir,
    });
  }

  /**
   * @param spans
   */
  export(spans: tracing.ReadableSpan[]) {
    for (const it of spans) {
      const resource = it.resource;
      this.logger.log(
        'INFO',
        [
          JSON.stringify({
            traceId: it.spanContext.traceId,
            spanId: it.spanContext.spanId,
            parentSpanId: it.parentSpanId,
            name: it.name,
            status: it.status,
            startTime: hrTimeToMilliseconds(it.startTime),
            endTime: hrTimeToMilliseconds(it.endTime),
            duration: hrTimeToMilliseconds(it.duration),
            ended: it.ended,
            kind: it.kind,
            context: it.spanContext,
            links: it.links,
            attributes: {
              ...resource.labels,
              ...it.attributes,
            },
            events: it.events,
          }),
        ],
        { raw: true }
      );
    }
  }

  shutdown() {}

  getGlobalTags() {
    const { reporterFile: config } = this.ctx.config;
    return config.globalTags;
  }
}
