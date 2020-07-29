import util = require('util');
import { Transport } from 'egg-logger';
import { ExceptionProcessor } from '@pandorajs/component-logger';
import { Resource } from '@opentelemetry/resources';
import { spanSymbol } from './constant';

export default class ExceptionLogTransport extends Transport {
  private path: string;
  constructor(
    private resource: Resource,
    private exceptionProcessor: ExceptionProcessor,
    options
  ) {
    super({ level: 'ERROR', ...options });
    this.path = options.path;
  }

  log(level, args: any[], meta) {
    const levelLowerCase = (level || '').toLowerCase();
    let error = args[0];
    try {
      if (!(error instanceof Error)) {
        error = new Error((util.format as any)(...args));
        error.name = 'Error';
        Error.captureStackTrace(error, this.log);
      }

      // egg-logger 的 context logger 中在 meta 注入了 ctx
      const traceId = meta?.ctx?.[spanSymbol]?.spanContext.traceId ?? '';
      const spanId = meta?.ctx?.[spanSymbol]?.spanContext.spanId ?? '';
      const traceName = meta?.ctx
        ? `${meta?.ctx.method} ${meta?.ctx.routerPath ?? '(not routed)'}`
        : '(not traced)';
      this.exceptionProcessor.export({
        timestamp: Date.now(),
        level: levelLowerCase,
        traceId,
        spanId,
        traceName,
        resource: this.resource,
        name: error.name,
        message: error.message,
        stack: error.stack,
        attributes: error,
        path: this.path,
      });
    } catch (err) {
      console.error(
        'Unexpected exception during exceptionProcessor.export()',
        err
      );
    }
  }
}
