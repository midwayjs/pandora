'use strict';

import { Patcher, getRandom64 } from 'pandora-metrics';
import { extractPath } from '../utils/Utils';
import { HEADER_TRACE_ID } from '../utils/Constants';
import * as http from 'http';

export class HttpServerPatcher extends Patcher {

  constructor(options = {}) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'httpServer';
  }

  getTraceId(req) {
    return req.headers[HEADER_TRACE_ID] || getRandom64();
  }

  createSpan(tracer, tags) {
    const span = tracer.startSpan('http', {
      traceId: tracer.getAttrValue('traceId')
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
        value: extractPath(req.url),
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

  beforeFinish(span, res) {
    span.setTag('http.status_code', {
      type: 'number',
      value: res.statusCode
    });
  }

  shimmer(options) {
    const self = this;
    const traceManager = this.getTraceManager();

    this.getShimmer().wrap(http, 'createServer', function wrapCreateServer(createServer) {

      return function wrappedCreateServer(this: any, requestListener) {
        if (requestListener) {

          const listener = traceManager.bind(function(req, res) {
            if (self.requestFilter(req)) {
              return requestListener(req, res);
            }

            traceManager.bindEmitter(req);
            traceManager.bindEmitter(res);

            const tracer = self.createTracer(req);
            const tags = self.buildTags(req);
            const span = self.createSpan(tracer, tags);

            tracer.named(`HTTP-${tags['http.method'].value}:${tags['http.url'].value}`);
            tracer.setCurrentSpan(span);

            res.once('finish', () => {
              self.beforeFinish(span, res);
              span.finish();
              tracer.finish(options);
              self.afterFinish(span, res);
            });

            return requestListener(req, res);
          });

          return createServer.call(this, listener);
        }
        return createServer.call(this, requestListener);
      };
    });
  }

  afterFinish(span, res) {
    // overwrite
  }
}
