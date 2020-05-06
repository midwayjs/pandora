import {FileLoggerManager, ILogger} from 'pandora-component-file-logger-service';
import {join} from 'path';
import * as api from '@opentelemetry/api'
import * as tracing from '@opentelemetry/tracing'
import {FileReporterUtil} from './FileReporterUtil';

export class SandboxTraceFileReporter implements tracing.SpanProcessor {
  type = 'trace';
  ctx: any;
  logger: ILogger;
  constructor(ctx: any) {
    this.ctx = ctx;
    const {appName} = ctx;
    const {sandboxFileReporter: config} = ctx.config;
    const fileLoggerManager: FileLoggerManager = this.ctx.fileLoggerManager;
    this.logger = fileLoggerManager.createLogger('sandbox-traces', {
      ...config.trace,
      dir: join(config.logsDir, appName)
    });
  }

  forceFlush() {

  }

  onStart(span: api.Span) {

  }

  /**
   * TODO: span should be a serializable representation of api.Span
   * @param span
   */
  onEnd(span: any) {
    const globalTags = this.getGlobalTags();
    const readableSpan = {
      traceId: span.spanContext.traceId,
      parentId: span.parentSpanId,
      name: span.name,
      id: span.spanContext.spanId,
      kind: span.kind,
      timestamp: hrTimeToMicroseconds(span.startTime),
      duration: hrTimeToMicroseconds(span.duration),
      attributes: span.attributes,
      status: span.status,
      events: span.events,
    };
    this.logger.log('INFO', [JSON.stringify({
      ...readableSpan,
      // TODO: normative format doc
      ...globalTags
    })], { raw: true });
  }

  shutdown() {

  }

  getGlobalTags() {
    const {sandboxFileReporter: config} = this.ctx.config;
    return config.globalTags;
  }
}

function hrTimeToMicroseconds(hrTime: api.HrTime): number {
  return Math.round(hrTime[0] * 1e6 + hrTime[1] / 1e3);
}
