const util = require('util');
const { Transport } = require('egg-logger');

class PandoraLogTransport extends Transport {
  path;
  logProcessor;
  constructor(options) {
    super(options);
    this.path = options.path;
    this.logProcessor = options.logProcessor;
  }

  log(level, args, meta) {
    const levelLowerCase = (level || '').toLowerCase();
    if (levelLowerCase !== 'error' && levelLowerCase !== 'warn') {
      return;
    }
    let error = args[0];
    try {
      if (!(error instanceof Error)) {
        error = new Error(util.format(...args));
        error.name = 'Error';
        Error.captureStackTrace(error, this.log);
      }

      // FIXME: replace with ?.
      // egg-logger 的 context logger 中在 meta 注入了 ctx
      const traceId = (meta && meta.ctx && meta.ctx.traceId) || '';

      const data = {
        level: levelLowerCase,
        timestamp: Date.now(),
        name: error.name,
        message: error.message,
        stack: error.stack,
        traceId,
        path: this.path || 'egg-logger',
      };
      this.logProcessor.export(data);
    } catch (err) {
      console.error('Error during logProcessor.export()', err);
    }
  }
}

module.exports = PandoraLogTransport;
