'use strict';

module.exports = (config, app) => {
  const meter = app.pandora.meterProvider.getMeter('egg');
  const httpRequestCount = meter
    .createCounter('http_request_count', { labelKeys: ['pid'] })
    .bind({ pid: String(process.pid) });
  const httpRequestRT = meter
    .createMeasure('http_request_rt', { labelKeys: ['pid'] })
    .bind({ pid: String(process.pid) });

  return async function (ctx, next) {
    const startTime = Date.now();
    await next();
    httpRequestCount.add(1);
    httpRequestRT.record(Date.now() - startTime);
  };
};
