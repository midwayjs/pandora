const core = require('@opentelemetry/core');
const LogTransport = require('./log-transport');
const constant = require('./constant');

module.exports = app => {
  // trigger hook on https for preloaded urllib.
  require('https');

  for (const name of app.loggers.keys()) {
    const logger = app.loggers.get(name);
    let path;
    for (const transport of logger.values()) {
      path = transport.options.file;
      if (path) break;
    }

    logger.set(
      'pandora',
      new LogTransport({
        level: 'ALL',
        path,
        logProcessor: app.pandora.logProcessor,
      })
    );
  }

  const meter = app.pandora.meterProvider.getMeter('egg');
  const httpRequestCount = meter
    .createCounter('http_request_count', { labelKeys: ['pid'] })
    .bind({ pid: String(process.pid) });
  const httpRequestRT = meter
    .createMeasure('http_request_rt', { labelKeys: ['pid'] })
    .bind({ pid: String(process.pid) });
  const startTimeWeakMap = new WeakMap();

  const tracer = app.pandora.tracerProvider.getTracer('@pandorajs/egg-pandora');
  app.on('request', ctx => {
    startTimeWeakMap.set(ctx, Date.now());
    httpRequestCount.add(1);
    const span = tracer.getCurrentSpan();
    ctx[constant.span] = span;
    // TODO:
    span.__end = span.end;
    span.end = time => {
      span.__endTime = time || core.hrTime();
    };
  });
  app.on('response', ctx => {
    const startTime = startTimeWeakMap.get(ctx);
    if (startTime == null) {
      return;
    }
    httpRequestRT.record(Date.now() - startTime);
    ctx[constant.span].updateName(ctx.routerPath);
    ctx[constant.span].__end(ctx[constant.span].__endTime);
  });
};