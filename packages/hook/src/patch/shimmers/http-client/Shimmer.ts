/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

const assert = require('assert');
const debug = require('debug')('PandoraHook:HttpClient:Shimmer');
import { DEFAULT_HOST, DEFAULT_PORT } from '../../../utils/Constants';
import { nodeVersion } from '../../../utils/Utils';
import { ClientRequest } from 'http';

export class HttpClientShimmer {

  options = {};
  shimmer = null;
  traceManager = null;

  constructor(shimmer, traceManager, options = {}) {
    assert(shimmer, 'shimmer must given');
    assert(traceManager, 'traceManager must given');

    Object.assign(this.options, options);
    this.shimmer = shimmer;
    this.traceManager = traceManager;
  }

  wrapHttpRequest(target) {
    this.shimmer.wrap(target, 'request', this.httpRequestWrapper);

    if (nodeVersion('>=8')) {
      this.shimmer.wrap(target, 'get', this.httpRequestWrapper);
    }
  }

  httpRequestWrapper = (request) => {
    const self = this;
    const traceManager = this.traceManager;

    return function wrappedHttpRequest(this: ClientRequest) {
      const tracer = traceManager.getCurrentTracer();

      if (!tracer) {
        debug('No current tracer, skip trace');
        return request.apply(this, arguments);
      }

      const currentSpan = tracer.getCurrentSpan();

      if (!currentSpan) {
        debug('No current span, skip trace');
        return request.apply(this, arguments);
      }

      const args = Array.from(arguments);
      const _request = request.apply(this, args);

      const traceId = tracer.getAttrValue('traceId');

      const span = tracer.startSpan('http-client', {
        childOf: currentSpan,
        traceId
      });

      if (!span) {
        debug('Create new span empty, skip trace');
        return _request;
      }

      const tags = self.buildTags(args, _request);

      span.addTags(tags);

      self.wrapRequest(_request, span);

      return _request;
    };
  }

  wrapRequest = (request, span) => {
    const traceManager = this.traceManager;
    const shimmer = this.shimmer;
    const self = this;

    shimmer.wrap(request, 'emit', function requestEmitWrapper(emit) {
      const bindRequestEmit = traceManager.bind(emit);

      return function wrappedRequestEmit(this: ClientRequest, event, arg) {
        if (event === 'error') {
          self.handleError(span, arg);
        } else if (event === 'response') {
          self.handleResponse(span, arg);
        }

        return bindRequestEmit.apply(this, arguments);
      };
    });
  }

  handleError(span, arg) {
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
  }

  handleResponse(span, res) {
    const traceManager = this.traceManager;
    const shimmer = this.shimmer;

    shimmer.wrap(res, 'emit', function wrapResponseEmit(emit) {
      const bindResponseEmit = traceManager.bind(emit);

      return function wrappedResponseEmit(this: ClientRequest, event) {
        if (event === 'end') {
          if (span) {
            const tracer = traceManager.getCurrentTracer();

            span.setTag('error', {
              type: 'bool',
              value: false
            });

            span.setTag('http.status_code', {
              type: 'number',
              value: res.statusCode
            });

            tracer.setCurrentSpan(span);
            span.finish();
          }
        }

        return bindResponseEmit.apply(this, arguments);
      };
    });
  }

  protected buildTags(args, request) {
    const options = args[0];

    return {
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
        value: request.path,
        type: 'string'
      }
    };
  }
}