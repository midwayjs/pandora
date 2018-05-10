import * as assert from 'assert';
import {DEFAULT_HOST, DEFAULT_PORT, HEADER_SPAN_ID, HEADER_TRACE_ID} from '../../../utils/Constants';
import {nodeVersion} from '../../../utils/Utils';
import {ClientRequest} from 'http';

const debug = require('debug')('PandoraHook:HttpClient:Shimmer');

// TODO: 接受参数，处理或记录请求详情

export type bufferTransformer = (buffer) => object | string;

export class HttpClientShimmer {

  options: {
    recordResponse?: boolean
    bufferTransformer?: bufferTransformer
  } = {};
  shimmer = null;
  traceManager = null;

  constructor(shimmer, traceManager, options) {
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

  remoteTracing(args, tracer, span) {
    const options = args[0];
    const traceId = tracer.traceId || '';
    const spanId = span.context().spanId || '';

    if (options.headers) {
      if (!options.headers[HEADER_TRACE_ID]) {
        debug('set header trace id.');
        options.headers[HEADER_TRACE_ID] = traceId;
      }

      if (!options.headers[HEADER_SPAN_ID]) {
        debug('set header span id.');
        options.headers[HEADER_SPAN_ID] = spanId;
      }
    } else {
      options.headers = {
        [HEADER_TRACE_ID]: traceId,
        [HEADER_SPAN_ID]: spanId
      };
    }

    return args;
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
    return tracer.startSpan('http-client', {
      childOf: currentSpan,
      traceId
    });
  }

  initTracerAndSpan(request, args) {
    const traceManager = this.traceManager;
    const options = this.options;
    const tracer = traceManager.getCurrentTracer();
    if (!tracer) return {};
    const span = this.createSpan(tracer);
    if (!span) return {};

    if ((<any>options).remoteTracing) {
      args = this.remoteTracing(args, tracer, span);
    }
    const tags = this.buildTags(args, request);

    span.addTags(tags);

    return {tracer, span};
  }

  recordResponseWrap(req, res, tracer, span) {
    const self = this;
    const recordResponse = this.options.recordResponse;
    const bufferTransformer = this.options.bufferTransformer || self.bufferTransformer;

    res.__responseSize = 0;
    res.__chunks = [];
    res.on('data', (data) => {
      const chunk = data || [];
      res.__responseSize += chunk.length;
      if (recordResponse) {
        res.__chunks.push(chunk);
      }
    });
    res.once('end', () => {
      if (span && recordResponse) {
        const response = bufferTransformer(res.__chunks);
        span.log({
          response
        });
        delete res.__responseSize;
        delete res.__chunks;
      }
    });
  }

  /**
   * 注册钩子
   * @param req
   * @param res
   * @param tracer
   * @param span
   */
  wrapRequest(req, res, tracer, span) {
    // TODO this.recordQuery(req, tracer, span);
    // TODO this.recordData(req, tracer, span);
    this.recordResponseWrap(req, res, tracer, span);
  }

  httpRequestWrapper = (request) => {
    const self = this;

    return function wrappedHttpRequest(this: ClientRequest) {
      let args = Array.from(arguments);

      const {tracer, span} = self.initTracerAndSpan(request, args);
      if (!tracer) {
        debug('No current tracer, skip trace');
        return request.apply(this, args);
      }
      if (!span) {
        debug('Create new span empty, skip trace');
        return request.apply(this, args);
      }

      const _request = request.apply(this, args);

      // self.wrapRequest(_request, tracer, span);

      _request.once('error', (res) => {
        self.handleError(span, res);
      });

      _request.once('response', (res) => {
        self.wrapRequest(_request, res, tracer, span);
        self.handleResponse(_request, res, tracer, span);
      });
      return _request;
    };
  }

  protected _requestError(res, span) {

    // clear cache when request error
    delete res.__responseSize;
    delete res.__chunks;

    span.setTag('http.error_code', {
      type: 'string',
      value: res.code
    });

    span.setTag('http.status_code', {
      type: 'number',
      value: -1 // 请求过程失败
    });
  }

  handleError(this: any, span, arg) {
    if (span) {
      span.error(true);

      this._requestError(arg, span);

      span.finish();
      this._finish(arg, span);
    }
  }


  handleResponse(req, res, tracer, span) {
    const self = this;
    res.once('end', () => {
      span.error(false);
      self._responseEnd(res, span);
      tracer.setCurrentSpan(span);
      span.finish();
      self._finish(res, span);
    });
  }

  protected _responseEnd(res, span) {
    const socket = res.socket;
    const remoteIp = socket ? (socket.remoteAddress ? `${socket.remoteAddress}:${socket.remotePort}` : '') : '';
    const responseSize = (res.headers && res.headers['content-length']) || res.__responseSize;
    span.setTag('http.status_code', {
      type: 'number',
      value: res.statusCode
    });

    span.setTag('http.remote_ip', {
      type: 'number',
      value: remoteIp
    });

    span.setTag('http.response_size', {
      type: 'number',
      value: responseSize
    });
  }

  protected _finish(res, span) {
  }

  bufferTransformer(buffer): string {
    try {
      return buffer.toString('utf8');
    } catch (error) {
      debug('transform response data error. ', error);
      return '';
    }
  }

  protected buildTags(args, request) {
    const options = args[0];

    return {
      'http.client': {
        value: true,
        type: 'bool'
      },
      'http.method': {
        value: options.method || 'GET', // use 'GET' default, like node.js
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
        value: request.path || '/', // use '/' default, like node.js
        type: 'string'
      }
    };
  }
}