'use strict';

const http = require('http');
import { Patcher, MessageConstants, getRandom64 } from 'pandora-metrics';
import { scrub } from '../utils/url';

export class HttpPatcher extends Patcher {

  constructor() {
    super();

    this.shimmer();
  }

  getTraceId(req) {
    return req.headers['x-trace-id'] || getRandom64();
  }

  createSpan(tracer, tags) {
    const span = tracer.startSpan('http', {
      traceId: tracer.getAttr('traceId')
    });

    span.addTags(tags);

    return span;
  }

  createTracer(req) {
    const traceId = this.getTraceId(req);

    return this.getTraceManager().create({ traceId });
  }

  buildTags(req) {

    return {
      'http.method': {
        value: req.method.toUpperCase(),
        type: 'string'
      },
      'http.url': {
        value: scrub(req.url),
        type: 'string'
      },
      'http.client': {
        value: false,
        type: 'bool'
      }
    };
  }

  /**
   * 过滤请求，按需实现
   * @param {HttpRequest} req - Http 请求
   * @returns {Boolean} 是否被忽略
   */
  requestFilter(req) {
    return false;
  }

  shimmer() {
    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().wrap(http, 'createServer', function wrapCreateServer(createServer) {

      return function wrappedCreateServer(requestListener) {
        if (requestListener) {

          const listener = traceManager.bind(function(req, res) {
            traceManager.bindEmitter(req);
            traceManager.bindEmitter(res);

            const tracer = self.createTracer(req);
            const tags = self.buildTags(req);
            const span = self.createSpan(tracer, tags);

            tracer.setCurrentSpan(span);

            res.once('finish', () => {
              span.setTag('http.status_code', {
                type: 'number',
                value: res.statusCode
              });
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
}
