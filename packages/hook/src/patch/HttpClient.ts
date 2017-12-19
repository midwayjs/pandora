/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

const http = require('http');
const https = require('https');
import { Patcher } from 'pandora-metrics';
import { argSlice } from '../utils/Utils';
import * as semver from 'semver';
import { DEFAULT_HOST, DEFAULT_PORT } from '../utils/Constants';

export class HttpClientPatcher extends Patcher {

  constructor(options = {}) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'http-client';
  }

  wrapHttpRequest = (request) => {
    const self = this;
    const traceManager = this.getTraceManager();

    return function wrappedHttpRequest() {
      const tracer = traceManager.getCurrentTracer();
      const args = argSlice(arguments);
      const context = this;

      if (tracer) {
        const _request = request.apply(context, args);
        const options = args[0];

        const tags = {
          'http.client': {
            value: true,
            type: 'bool'
          },
          'http.method': {
            value: options.method,
            type: 'string'
          },
          'http.hostname': {
            value: options.hostname || options.host || DEFAULT_HOST,
            type: 'string'
          },
          'http.port': {
            value: options.port || options._defaultAgent && options._defaultAgent.defaultPort || DEFAULT_PORT,
            type: 'string'
          },
          'http.path': {
            value: _request.path,
            type: 'string'
          }
        };

        const currentSpan = tracer.getCurrentSpan();
        let span;

        if (currentSpan) {
          const traceId = tracer.getAttrValue('traceId');

          span = tracer.startSpan('http-client', {
            childOf: currentSpan,
            traceId
          });
        }

        if (span) {
          span.addTags(tags);
        }

        self.getShimmer().wrap(_request, 'emit', function wrapRequestEmit(emit) {
          const bindRequestEmit = traceManager.bind(emit);

          return function wrappedRequestEmit(event, arg) {
            if (event === 'error') {
              if (span) {
                span.setTag('error', {
                  type: 'bool',
                  value: true
                });

                span.setTag('http.error_code', {
                  type: 'string',
                  value: arg.code
                });

                span.setTag('http.status_code', {
                  type: 'number',
                  value: -1
                });

                span.finish();
              }
            } else if (event === 'response') {
              self.getShimmer().wrap(arg, 'emit', function wrapResponseEmit(emit) {
                const bindResponseEmit = traceManager.bind(emit);

                return function wrappedResponseEmit(event) {
                  if (event === 'end') {
                    if (span) {
                      span.setTag('error', {
                        type: 'bool',
                        value: false
                      });

                      span.setTag('http.status_code', {
                        type: 'number',
                        value: arg.statusCode
                      });
                      tracer.setCurrentSpan(span);
                      span.finish();
                    }
                  }

                  return bindResponseEmit.apply(this, arguments);
                };
              });
            }

            return bindRequestEmit.apply(this, arguments);
          };
        });

        return _request;
      }

      return request.apply(context, args);
    };
  }

  _shimmer(target) {
    this.getShimmer().wrap(target, 'request', this.wrapHttpRequest);

    if (semver.satisfies(<any>process.version, '>=8')) {
      this.getShimmer().wrap(target, 'get', this.wrapHttpRequest);
    }
  }

  shimmer(options) {
    const WRAP_HTTPS = semver.satisfies(<any>process.version, '<0.11 || >=9.0.0 || 8.9.0');

    this._shimmer(http);

    if (WRAP_HTTPS || options.forceHttps) {
      this._shimmer(https);
    }
  }
}