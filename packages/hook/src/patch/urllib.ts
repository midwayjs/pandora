'use strict';
import {Patcher, MessageConstants} from 'pandora-metrics';

export class UrllibPatcher extends Patcher {

  constructor() {
    super();

    const self = this;
    this.hook('^2.x', (loadModule) => {
      const urllib = loadModule('lib/urllib');
      self.getShimmer().wrap(urllib, 'requestWithCallback', (request) => {
        return function wrapped(url, args, callback) {
          if (arguments.length === 2 && typeof args === 'function') {
            callback = args;
            args = null;
          }

          args = args || {};
          const startTime = Date.now();

          const tracer = self.getTraceManager().getCurrentTracer();
          const tags = self.buildTags(url, args);
          const span = self.createSpan(tracer, tags);

          return request.call(this, url, args, (err, data, res) => {
            if (span) {
              tracer.setCurrentSpan(span);
              span.setTag('error', err);
              span.setTag('response', res);
              span.finish();
            } else {
              // TODO: 完善以 urllib 为链路起点的操作跟踪
              process.nextTick(() => {
                self.getSender().send(MessageConstants.TRACENODE, {
                  name: 'urllib',
                  data: Object.assign({
                    startTime,
                    endTime: Date.now(),
                    error: err,
                    res: res
                  }, tags)
                });
              });
            }

            callback(err, data, res);
          });
        };
      });
    });
  }

  getModuleName() {
    return 'urllib';
  }

  buildTags(url, args) {
    return {
      method: (args.method || 'GET').toLowerCase(),
      url,
      data: args.data,
      content: args.content,
      contentType: args.contentType,
      dataType: args.dataType,
      headers: args.headers,
      timeout: args.timeout,
    };
  }

  createSpan(tracer, tags) {
    let span;

    if (tracer) {
      const currentSpan = tracer.getCurrentSpan();

      if (currentSpan) {
        const traceId = currentSpan.context().traceId;

        span = tracer.startSpan('urllib', {
          childOf: currentSpan,
          ctx: {
            traceId
          }
        });
      }
    }

    if (span) {
      span.addTags(tags);
    }

    return span;
  }
}
