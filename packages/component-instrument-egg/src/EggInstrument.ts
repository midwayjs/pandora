import * as core from '@opentelemetry/core';
import type { EggApplication } from 'egg';
import LogTransport from './LogTransport';
import { spanSymbol } from './constant';
import { Transport } from './type';

export default (app: EggApplication) => {
  // trigger hook on http/https for preloaded urllib.
  require('http');
  require('https');

  for (const name of app.loggers.keys()) {
    const logger = app.loggers.get(name);
    let path;
    for (const transport of logger.values()) {
      path = (transport as Transport).options.file;
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
  // TODO: resources
  const labels = {
    pid: String(process.pid),
    isProvider: 'true',
    rpcType: 'http',
  };
  const httpRequestCounter = meter.createCounter('rpc_requests_count');
  const httpRequestErrorCounter = meter.createCounter(
    'rpc_requests_error_count'
  );
  const httpRequestSecondsRecorder = meter.createValueRecorder(
    'rpc_requests_seconds',
    { description: 'histogram{0.1,1,10}' }
  );
  const httpRequestMsRecorder = meter.createValueRecorder(
    'rpc_requests_milliseconds',
    { description: 'histogram{100,1000,10000}' }
  );
  const startTimeWeakMap = new WeakMap();

  const tracer = app.pandora.tracerProvider.getTracer('@pandorajs/egg-pandora');
  app.on('request', ctx => {
    startTimeWeakMap.set(ctx, Date.now());
    const span = tracer.getCurrentSpan();
    if (span == null) {
      return;
    }
    ctx[spanSymbol] = span;
    // TODO:
    span.__end = span.end;
    span.end = time => {
      span.__endTime = time || core.hrTime();
    };
  });
  app.on('response', ctx => {
    const rpc = `${ctx.method} ${ctx.routerPath ?? '(not routed)'}`;
    httpRequestCounter.add(1, {
      ...labels,
      rpc,
      httpStatusCode: String(ctx.realStatus),
    });
    if (ctx.realStatus >= 400) {
      httpRequestErrorCounter.add(1, {
        ...labels,
        rpc,
        httpStatusCode: String(ctx.realStatus),
      });
    }
    const startTime = startTimeWeakMap.get(ctx);
    if (startTime == null) {
      return;
    }
    httpRequestSecondsRecorder.record((Date.now() - startTime) / 1000, {
      ...labels,
      rpc,
    });
    httpRequestMsRecorder.record(Date.now() - startTime, { ...labels, rpc });
    const span = ctx[spanSymbol];
    if (span == null) {
      return;
    }
    span.updateName(`${ctx.method} ${ctx.routerPath}`);
    span.__end(span.__endTime);
  });
};
