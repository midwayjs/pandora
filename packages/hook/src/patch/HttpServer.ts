'use strict';

import { getRandom64, MetricLevel, MetricName, MetricsClientUtil, Patcher } from 'pandora-metrics';
import { extractPath } from '../utils/Utils';
import { HEADER_TRACE_ID } from '../utils/Constants';
import { parse as parseUrl } from 'url';
import { parse as parseQS, ParsedUrlQuery } from 'querystring';
import * as http from 'http';
import { IncomingMessage } from 'http';
import parseInt = require('lodash/fp/parseInt');

const debug = require('debug')('Pandora:Hook:HttpServerPatcher');

export type bufferTransformer = (buffer, req?: IncomingMessage) => object | string;

export type requestFilter = (req) => boolean;


const MetricsStat = {
  /** HTTP */
  HTTP_REQUEST: 'middleware.http.request',

  HTTP_REQUEST_PATH: 'middleware.http.request.path',

  HTTP_GROUP: 'http',

  HTTP_PATH: 'path',

  HTTP_ERROR_CODE: 400,

  HTTP_ILLEGAL_PATH: 'illegal_path'
};

export class HttpServerPatcher extends Patcher {

  constructor(options?: {
    recordGetParams?: boolean,
    recordPostData?: boolean,
    bufferTransformer?: bufferTransformer,
    requestFilter?: requestFilter,
    recordUrl?: boolean
  }) {
    super(options || {});

    this.shimmer(this.options);
  }

  getModuleName() {
    return 'httpServer';
  }

  getModule() {
    return http;
  }

  getTraceId(req) {
    return req.headers[ HEADER_TRACE_ID ] || getRandom64();
  }

  createSpan(tracer, tags) {
    const span = tracer.startSpan('http', {
      traceId: tracer.traceId
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

  _beforeExecute(tracer, req, res) {
  }

  beforeFinish(span, res) {
    span.setTag('http.status_code', {
      type: 'number',
      value: res.statusCode
    });
  }

  processGetParams(req) {
    const url = req.url;

    if (url) {
      let urlParsed;

      try {
        urlParsed = parseUrl(url, true);
      } catch (error) {
        debug('process get params error. ', error);

        return {};
      }

      return urlParsed.query;
    }

    return {};
  }

  bufferTransformer(buffer, req?: IncomingMessage): ParsedUrlQuery | string {
    try {
      return parseQS(buffer.toString('utf8'));
    } catch (error) {
      debug('transform post data error. ', error);
      return '';
    }
  }

  getFullUrl(req: IncomingMessage): string {
    if (!req) return '';

    const secure = (<any>req.connection).encrypted || req.headers[ 'x-forwarded-proto' ] === 'https';

    return 'http' + (secure ? 's' : '') + '://' +
      req.headers.host +
      req.url;
  }

  shimmer(options) {
    const self = this;
    const traceManager = this.getTraceManager();
    const shimmer = this.getShimmer();

    shimmer.wrap(this.getModule(), 'createServer', function wrapCreateServer(createServer) {

      return function wrappedCreateServer(this: any, requestListener) {
        if (requestListener) {

          const listener = traceManager.bind(function (req, res) {
            const requestFilter = options.requestFilter || self.requestFilter;

            if (requestFilter(req)) {
              debug('request filter by requestFilter, skip trace.');
              return requestListener(req, res);
            }

            traceManager.bindEmitter(req);
            traceManager.bindEmitter(res);

            const tracer = self.createTracer(req);
            self._beforeExecute(tracer, req, res);
            const tags = self.buildTags(req);
            const span = self.createSpan(tracer, tags);

            if (options.recordUrl) {
              // record origin url
              span.log({
                originUrl: self.getFullUrl(req)
              });
            }

            if (options.recordGetParams) {
              const query = self.processGetParams(req);

              span.log({
                query
              });
            }

            let chunks = [];
            if (options.recordPostData && req.method && req.method.toUpperCase() === 'POST') {
              shimmer.wrap(req, 'emit', function wrapRequestEmit(emit) {
                const bindRequestEmit = traceManager.bind(emit);

                return function wrappedRequestEmit(this: IncomingMessage, event) {
                  if (event === 'data') {
                    const chunk = arguments[ 1 ] || [];

                    chunks.push(chunk);
                  }

                  return bindRequestEmit.apply(this, arguments);
                };
              });
            }

            tracer.named(`HTTP-${tags[ 'http.method' ].value}:${tags[ 'http.url' ].value}`);
            tracer.setCurrentSpan(span);

            function onFinishedFactory(eventName) {
              return function onFinished() {
                res.removeListener('finish', onFinished);
                req.removeListener('aborted', onFinished);

                if (eventName !== 'aborted' && options.recordPostData && req.method && req.method.toUpperCase() === 'POST') {
                  const transformer = options.bufferTransformer || self.bufferTransformer;
                  const postData = transformer(Buffer.concat(chunks), req);

                  span.log({
                    data: postData
                  });
                  // clear cache
                  chunks = [];
                }

                span.setTag('http.aborted', {
                  type: 'bool',
                  value: eventName === 'aborted'
                });

                self.beforeFinish(span, res);
                span.finish();
                tracer.finish(options);
                self.afterFinish(span, res);
              };
            }

            res.once('finish', onFinishedFactory('finish'));
            req.once('aborted', onFinishedFactory('aborted'));

            return requestListener(req, res);
          });

          return createServer.call(this, listener);
        }

        debug('no requestListener, skip trace.');
        return createServer.call(this, requestListener);
      };
    });
  }

  afterFinish(span, res) {
    this.reportMetrics({
      rt: span.duration,
      resultCode: res.statusCode
    });
  }

  reportMetrics(ctx) {
    let responseCode = ctx.resultCode;
    if (!responseCode) {
      return;
    }

    let global = new MetricName(MetricsStat.HTTP_REQUEST, {}, MetricLevel.NORMAL);

    let client = MetricsClientUtil.getMetricsClient();

    let globalCompass = client.getFastCompass(MetricsStat.HTTP_GROUP, global);

    if (MetricsStat.HTTP_ERROR_CODE > parseInt(responseCode)) {
      globalCompass.record(ctx.rt, 'success');
    } else {
      globalCompass.record(ctx.rt, 'error');
    }

  }
}
