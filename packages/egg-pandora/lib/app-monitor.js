const core = require('@opentelemetry/core');
const LogTransport = require('./log-transport');
const constant = require('./constant');

module.exports = app => {
  // trigger hook on http/https for preloaded urllib.
  require('http');
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
    .createCounter('http_request_count')
    .bind({ pid: String(process.pid) });
  const httpRequestFailureCount = meter
    .createCounter('http_request_failure_count')
    .bind({ pid: String(process.pid) });
  const httpRequestRT = meter
    .createValueRecorder('http_request_rt')
    .bind({ pid: String(process.pid) });
  const startTimeWeakMap = new WeakMap();

  const tracer = app.pandora.tracerProvider.getTracer('@pandorajs/egg-pandora');
  app.on('request', ctx => {
    startTimeWeakMap.set(ctx, Date.now());
    httpRequestCount.add(1);
    const span = tracer.getCurrentSpan();
    if (span == null) {
      return;
    }
    ctx[constant.span] = span;
    // TODO:
    span.__end = span.end;
    span.end = time => {
      span.__endTime = time || core.hrTime();
    };
  });
  app.on('response', ctx => {
    if (ctx.realStatus >= 400) {
      httpRequestFailureCount.add(1);
    }
    const startTime = startTimeWeakMap.get(ctx);
    if (startTime == null) {
      return;
    }
    httpRequestRT.record(Date.now() - startTime);
    const span = ctx[constant.span];
    if (span == null) {
      return;
    }
    span.updateName(`${ctx.method} ${ctx.routerPath}`);
    span.__end(span.__endTime);
  });
};
