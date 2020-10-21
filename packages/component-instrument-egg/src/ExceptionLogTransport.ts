import util = require('util');
import { Transport } from 'egg-logger';
import { ExceptionProcessor } from '@pandorajs/component-logger';
import { spanSymbol } from './constant';
import { Span } from '@opentelemetry/api';

export default class ExceptionLogTransport extends Transport {
  private path: string;
  constructor(private exceptionProcessor: ExceptionProcessor, options) {
    super({ level: 'ERROR', ...options });
    this.path = options.path;
  }

  log(level, args: any[], meta) {
    const levelLowerCase = (level || '').toLowerCase();
    if (levelLowerCase !== 'error') {
      return;
    }
    let error = args[0];
    try {
      if (!(error instanceof Error)) {
        error = new Error((util.format as any)(...args));
        error.name = 'Error';
        Error.captureStackTrace(error, this.log);
      }

      // egg-logger 的 context logger 中在 meta 注入了 ctx
      const span = meta?.ctx?.[spanSymbol] as Span | undefined;
      const traceId = span?.context().traceId ?? '';
      const spanId = span?.context().spanId ?? '';
      const traceName = meta?.ctx
        ? `${meta?.ctx.method} ${meta?.ctx.routerPath ?? '(not routed)'}`
        : '(not traced)';
      this.exceptionProcessor.export({
        timestamp: Date.now(),
        level: levelLowerCase,
        traceId,
        spanId,
        traceName,
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
