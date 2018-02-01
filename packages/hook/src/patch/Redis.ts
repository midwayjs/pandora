/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { Patcher } from 'pandora-metrics';
const debug = require('debug')('PandoraHook:Redis');

export class RedisPatcher extends Patcher {
  constructor(options = {
    recordParams: true
  }) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'ioredis';
  }

  createSpan(tracer) {
    let span = null;

    const currentSpan = tracer.getCurrentSpan();

    if (!currentSpan) {
      debug('No current span, skip trace');
      return span;
    }

    return this._createSpan(tracer, currentSpan);
  }

  protected _createSpan(tracer, currentSpan) {
    const traceId = tracer.traceId;

    return tracer.startSpan('redis', {
      childOf: currentSpan,
      traceId
    });
  }

  buildTags(ctx, command) {
    const options = Object.assign({}, ctx.options || {});

    return {
      'redis.method': {
        value: command.name,
        type: 'string'
      },
      'redis.host': {
        value: options.host,
        type: 'string'
      },
      'redis.port': {
        value: String(options.port) || options.path,
        type: 'string'
      },
      'redis.db': {
        value: String(options.db),
        type: 'string'
      }
    };
  }

  finish(tracer, span, isError) {
    tracer.setCurrentSpan(span);
    span.error(isError);
    span.finish();

    this._finish(span, isError);
  }

  protected _finish(span, isError) {}

  shimmer(options) {
    const traceManager = this.getTraceManager();
    const shimmer = this.getShimmer();
    const self = this;

    this.hook('^3.x', (loadModule) => {
      const Redis = loadModule('./lib/redis.js');

      shimmer.wrap(Redis.prototype, 'sendCommand', function wrapperSendCommand(sendCommand) {

        return function wrappedSendCommand(this: any, command, stream) {
          const tracer = traceManager.getCurrentTracer();

          if (!tracer) {
            debug('No current tracer, skip trace.');
            return sendCommand.apply(this, arguments);
          }

          const span = self.createSpan(tracer);

          if (!span) {
            debug('Create new span empty, skip trace.');
            return sendCommand.apply(this, arguments);
          }

          const tags = self.buildTags(this, command);
          span.addTags(tags);

          if (options.recordParams) {
            span.log({params: command.args});
          }

          let resolve = command.resolve;
          let reject = command.reject;

          resolve = traceManager.bind(resolve);
          reject = traceManager.bind(reject);

          const _resolve = function(this: any) {
            self.finish(tracer, span, false);

            return resolve.apply(this, arguments);
          };

          const _reject = function(this: any) {
            self.finish(tracer, span, true);

            return reject.apply(this, arguments);
          };

          command.resolve = traceManager.bind(_resolve);
          command.reject = traceManager.bind(_reject);

          return sendCommand.apply(this, [command, stream]);
        };
      });
    });
  }
}