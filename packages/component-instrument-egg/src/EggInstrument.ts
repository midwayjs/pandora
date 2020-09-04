import * as core from '@opentelemetry/core';
import {
  GeneralAttribute,
  HttpAttribute,
  RpcAttribute,
  RpcKind,
  RpcMetric,
} from '@pandorajs/semantic-conventions';
import type { EggApplication } from 'egg';
import ExceptionLogTransport from './ExceptionLogTransport';
import { spanSymbol, errorSymbol } from './constant';
import { Transport } from './type';
import { Meter, ValueType } from '@opentelemetry/api';

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

    const meter: Meter = app.pandora.meterProvider.getMeter('egg');
    const labels = {
      [GeneralAttribute.COMPONENT]: 'http',
      [RpcAttribute.KIND]: RpcKind.SERVER,
    };
    const rpcRequestCounter = meter.createCounter(RpcMetric.REQUEST_COUNT, {
      valueType: ValueType.INT,
    });
    const rpcRequestNoStatusCounter = meter.createCounter(
      RpcMetric.REQUEST_COUNT + '_no_status',
      {
        valueType: ValueType.INT,
      }
    );
    const rpcResponseErrorCounter = meter.createCounter(
      RpcMetric.RESPONSE_ERROR_COUNT,
      {
        valueType: ValueType.INT,
      }
    );
    const rpcResponseDurationRecorder = meter.createValueRecorder(
      RpcMetric.RESPONSE_DURATION,
      { description: 'summary{0.5,0.75,0.9,0.99}', valueType: ValueType.DOUBLE }
    );
    const startTimeWeakMap = new WeakMap();

    const tracer = app.pandora.tracerProvider.getTracer('pandora');
    app.on('error', (err, ctx) => {
      if (ctx == null) {
        return;
      }
      ctx[errorSymbol] = err;
    });
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
      const error = ctx[errorSymbol];
      const method = ctx.method;
      const route = ctx.routerPath ?? '(not routed)';
      const spanName = `${method} ${route}`;
      const commonCtxLabels = {
        ...labels,
        [HttpAttribute.HTTP_ROUTE]: route,
        [HttpAttribute.HTTP_METHOD]: method,
      };
      if (error) {
        commonCtxLabels['exception'] =
          error.name + ' ' + (error.stack.split('\n')[1] ?? '').trim();
      }
      rpcRequestNoStatusCounter.add(1, {
        ...commonCtxLabels,
      });
      rpcRequestCounter.add(1, {
        ...commonCtxLabels,
        [HttpAttribute.HTTP_STATUS_CODE]:
          ctx.realStatus >= 500
            ? '5xx'
            : ctx.realStatus >= 400
            ? '4xx'
            : ctx.realStatus >= 300
            ? '3xx'
            : '200',
      });
      if (ctx.realStatus >= 400) {
        rpcResponseErrorCounter.add(1, {
          ...commonCtxLabels,
        });
      }

      const startTime = startTimeWeakMap.get(ctx);
      if (startTime == null) {
        return;
      }
      rpcResponseDurationRecorder.record(Date.now() - startTime, {
        ...commonCtxLabels,
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
