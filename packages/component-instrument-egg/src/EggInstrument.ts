import * as core from '@opentelemetry/core';
import {
  GeneralAttribute,
  HttpAttribute,
  RpcAttribute,
  RpcKind,
  RpcMetric,
  parseHttpStatusCode,
} from '@pandorajs/semantic-conventions';
import type { EggApplication } from 'egg';
import ExceptionLogTransport from './ExceptionLogTransport';
import { spanSymbol } from './constant';
import { Transport } from './type';

type PandoraContext = any;
export default (ctx: PandoraContext) => {
  return (app: EggApplication) => {
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
        new ExceptionLogTransport(
          ctx.resource,
          app.pandora.exceptionProcessor,
          {
            path,
          }
        )
      );
    }

    const meter = app.pandora.meterProvider.getMeter('egg');
    const labels = {
      pid: String(process.pid),
      [GeneralAttribute.COMPONENT]: 'http',
      [RpcAttribute.KIND]: RpcKind.SERVER,
    };
    const rpcRequestCounter = meter.createCounter(RpcMetric.REQUEST_COUNT);
    const rpcResponseErrorCounter = meter.createCounter(
      RpcMetric.RESPONSE_ERROR_COUNT
    );
    const rpcResponseDurationRecorder = meter.createValueRecorder(
      RpcMetric.RESPONSE_DURATION,
      { description: 'histogram{100,1000,10000}' }
    );
    const startTimeWeakMap = new WeakMap();

    const tracer = app.pandora.tracerProvider.getTracer('pandora');
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
      const method = ctx.method;
      const route = ctx.routerPath ?? '(not routed)';
      const spanName = `${method} ${route}`;
      const canonicalCode = parseHttpStatusCode(ctx.realStatus);
      rpcRequestCounter.add(1, {
        ...labels,
        [HttpAttribute.HTTP_ROUTE]: route,
        [HttpAttribute.HTTP_METHOD]: method,
        [HttpAttribute.HTTP_STATUS_CODE]: String(ctx.realStatus),
        [RpcAttribute.RESPONSE_CANONICAL_CODE]: canonicalCode,
      });
      if (ctx.realStatus >= 400) {
        rpcResponseErrorCounter.add(1, {
          ...labels,
          rpc: route,
          httpStatusCode: String(ctx.realStatus),
        });
      }

      const startTime = startTimeWeakMap.get(ctx);
      if (startTime == null) {
        return;
      }
      rpcResponseDurationRecorder.record(Date.now() - startTime, {
        ...labels,
        [HttpAttribute.HTTP_ROUTE]: route,
        [HttpAttribute.HTTP_METHOD]: method,
        [HttpAttribute.HTTP_STATUS_CODE]: String(ctx.realStatus),
        [RpcAttribute.RESPONSE_CANONICAL_CODE]: canonicalCode,
      });

      const span = ctx[spanSymbol];
      if (span == null) {
        return;
      }
      span.updateName(spanName);
      span.__end(span.__endTime);
    });
  };
};
