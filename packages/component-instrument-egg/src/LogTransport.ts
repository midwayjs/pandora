import util = require('util');
import { Transport } from 'egg-logger';
import { spanSymbol } from './constant';

export default class PandoraLogTransport extends Transport {
  path;
  logProcessor;
  constructor(options) {
    super(options);
    this.path = options.path;
    this.logProcessor = options.logProcessor;
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
      const traceId = meta?.ctx?.[spanSymbol]?.spanContext.traceId ?? '';
      const data = {
        level: levelLowerCase,
        timestamp: Date.now(),
        name: error.name,
        message: error.message,
        stack: error.stack,
        traceId,
        traceName: meta?.ctx && `${meta?.ctx.method} ${meta?.ctx.routerPath}`,
        path: this.path || 'egg-logger',
      };
      this.logProcessor.export(data);
    } catch (err) {
      console.error('Error during logProcessor.export()', err);
    }
  }
}
