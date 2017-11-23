'use strict';
const http = require('http');
import {Patcher, MessageConstants} from 'pandora-metrics';
import {generateTraceId} from '../utils/trace';

export class HttpPatcher extends Patcher {

  constructor() {
    super();

    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().wrap(http, 'createServer', function wrapCreateServer(createServer) {
      return function wrappedCreateServer(requestListener) {
        if (requestListener) {

          const listener = traceManager.bind(function (req, res) {
            traceManager.bindEmitter(req);
            traceManager.bindEmitter(res);

            const traceId = self.getTraceId(req);
            const tracer = traceManager.create({
              traceId
            });

            const span = self.createSpan(tracer, req);

            res.once('finish', () => {
              span.finish();
              tracer.finish();
              self.getSender().send(MessageConstants.TRACE, tracer.report());
            });

            return requestListener(req, res);
          });
          return createServer.call(this, listener);
        }
        return createServer.call(this, requestListener);
      };
    });
  }

  getTraceId(req) {
    return req.headers['x-trace-id'] || generateTraceId();
  }

  createSpan(tracer, req) {
    const span = tracer.startSpan('http', {
      ctx: {
        traceId: this.getTraceId(req)
      }
    });

    span.setTag('method', req.method.toUpperCase());
    span.setTag('url', req.url);

    return span;
  }
}
