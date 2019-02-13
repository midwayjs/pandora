import {
  HttpClientPatcherOptions,
  HttpRequestCallback,
  HttpClientTags,
  ExIncomingMessage
} from '../../../domain';
import * as shimmer from '../../../Shimmer';
import { nodeVersion, urlToOptions, recordError } from '../../../utils';
import { RequestOptions, ClientRequest } from 'http';
import { URL, parse } from 'url';
import { IPandoraSpan } from 'pandora-component-trace';
import { CURRENT_CONTEXT, DEFAULT_HOST, DEFAULT_PORT } from '../../../constants';
import { Wrapper } from '../Wrapper';

export class HttpClientWrapper extends Wrapper {
  options: HttpClientPatcherOptions;

  wrap(target: any): void {
    shimmer.wrap(target, 'request', this.httpRequestWrapper);

    /* istanbul ignore next */
    if (nodeVersion('>=8')) {
      shimmer.wrap(target, 'get', this.httpRequestWrapper);
    }
  }

  /**
   * Node.js v10 增加了 url 参数
   * inspired by https://github.com/nodejs/node/blob/438f76b1d8abe1ff205aba09e47b31198851fef9/lib/_http_client.js#L67
   */
  argsCompatible(url: string | URL, options: RequestOptions, cb: HttpRequestCallback): RequestOptions {
    let _options;
    let _url;

    if (typeof url === 'string') {
      try {
        _url = urlToOptions(new URL(url));
      } catch (error) {
        this.logger.info('[HttpClientWrapper] URL parse failed, use origin parse. ', error);
        _url = parse(url);
      }
    } else if (url && url instanceof URL) {
      _url = urlToOptions(url);
    } else {
      _options = url;
      _url = null;
    }

    if (typeof options === 'function') {
      _options = null;
    }

    _options = Object.assign({}, _url || {}, options || {});

    return _options;
  }

  httpRequestWrapper = (request) => {
    const self = this;

    return function wrappedHttpRequest(url: string | URL, options: RequestOptions, cb: HttpRequestCallback): ClientRequest {
      const span = self.createSpan();

      if (!span) {
        self.logger.info('[HttpClientWrapper] span is null, skip trace.');
        return request.apply(null, arguments);
      }

      const _request = request.apply(null, arguments);

      // 追加请求前的 tags
      const args = self.argsCompatible(url, options, cb);
      const staticTags = self.staticTags(args, _request);
      span.addTags(staticTags);

      if (self.options.tracing) {
        self.tracing(span, _request);
      }

      self.wrapRequest(span, _request);

      return _request;
    };
  }

  createSpan(): IPandoraSpan {
    const tracer = this.tracer;

    if (!tracer) {
      this.logger.info('[HttpClientWrapper] no tracer, skip trace.');
      return null;
    }

    const context = this.cls.get(CURRENT_CONTEXT);

    if (!context) {
      this.logger.info('[HttpClientWrapper] no current context, skip trace.');
      return null;
    }

    const tags = {
      'http.client': true,
      is_entry: false
    };

    const span = tracer.startSpan(this.moduleName, {
      childOf: context,
      tags,
      startTime: Date.now()
    });

    this.cls.set(CURRENT_CONTEXT, span.context());

    return span;
  }

  staticTags(options: RequestOptions, clientRequest: ClientRequest): HttpClientTags {

    return {
      // use 'GET' default, like node.js
      'http.method': (options.method || 'GET').toUpperCase(),
      'http.hostname': options.hostname || options.host || DEFAULT_HOST,
      // defaultPort: https://github.com/nodejs/node/blob/eb664c3b6df2ec618fa1c9339dbd418e858bfcfa/lib/_http_agent.js#L48
      'http.port': options.port || options._defaultAgent && (<any>options._defaultAgent).defaultPort || DEFAULT_PORT,
      // use '/' default, like node.js
      'http.pathname': options.path || '/'
    };
  }

  tracing(span: IPandoraSpan, clientRequest: ClientRequest): void {
    const context = span.context();

    try {
      this.tracer.inject(context, 'http', clientRequest);
    } catch (error) {
      this.logger.info('[HttpClientWrapper] inject tracing context to headers error. ', error);
    }
  }

  wrapRequest(span: IPandoraSpan, clientRequest: ClientRequest): void {
    const self = this;

    shimmer.wrap(clientRequest, 'emit', function requestEmitWrapper(emit) {
      const bindRequestEmit = self.cls.bind(emit);

      return function wrappedRequestEmit(this: ClientRequest, event: string, args: any) {
        if (event === 'error') {
          self.handleRequestError(span, args);
        } else if (event === 'response') {
          self.handleResponse(span, args);
        }

        return bindRequestEmit.apply(this, arguments);
      };
    });
  }

  handleRequestError(span: IPandoraSpan, error: Error): void {
    /* istanbul ignore next */
    if (span) {
      span.error(true);
      this._handleRequestError(span, error);
      span.finish();
    }
  }

  _handleRequestError(span: IPandoraSpan, error: Error): void {
    span.setTag('http.status_code', -1);

    recordError(span, error, this.recordErrorDetail);
  }

  handleResponse(span: IPandoraSpan, res: ExIncomingMessage): void {
    const self = this;

    res.__responseSize = 0;
    res.__chunks = [];

    shimmer.wrap(res, 'emit', function wrapResponseEmit(emit) {
      const bindResponseEmit = self.cls.bind(emit);

      return function wrappedResponseEmit(this: ExIncomingMessage, event) {
        if (event === 'end') {
          /* istanbul ignore next */
          if (span) {
            self._handleResponse(span, res);
            self.exportResponse(span, res);
            span.error(false);
            span.finish();
          }
        } else if (event === 'data') {
          // may be string or Buffer, not null
          const chunk = arguments[1];
          res.__responseSize += chunk.length;

          self.recordResponse(chunk, res);
        }

        return bindResponseEmit.apply(this, arguments);
      };
    });
  }

  recordResponse(chunk: any, res: ExIncomingMessage) {
    /* istanbul ignore next */
    if (this.options.recordResponse) {
      const size = this.responseSize(res);

      if (size <= this.options.maxResponseSize) {
        res.__chunks.push(chunk);
      } else {
        this.logger.info('[HttpClientWrapper] response size greater than maxResponseSize, ignore chunk.');
      }
    }
  }

  exportResponse(span: IPandoraSpan, res: ExIncomingMessage) {
    if (this.options.recordResponse) {
      const chunks = res.__chunks;
      const response = this.responseTransformer(Buffer.concat(chunks), res);

      span.log({
        response
      });
    }

    // 清除记录
    delete res.__responseSize;
    delete res.__chunks;
  }

  _handleResponse(span: IPandoraSpan, res: ExIncomingMessage) {
    const socket = res.socket;
    const remoteIp = socket ? (socket.remoteAddress ? `${socket.remoteAddress}:${socket.remotePort}` : '') : '';
    const responseSize = this.responseSize(res);

    span.setTag('http.status_code', res.statusCode);
    span.setTag('http.remote_ip', remoteIp);
    span.setTag('http.response_size', responseSize);
  }

  responseTransformer(buffer: Buffer, res?: ExIncomingMessage): string {
    const responseTransformer = this.options.responseTransformer;

    try {
      return responseTransformer && responseTransformer(buffer, res) || buffer.toString('utf8');
    } catch (error) {
      this.logger.info('transform response data error. ', error);
      return '';
    }
  }

  responseSize(res: ExIncomingMessage): number {
    if (res.headers && res.headers['content-length']) {
      return parseInt(res.headers['content-length'], 10);
    } else {
      return res.__responseSize;
    }
  }

  unwrap(target: any): void {
    shimmer.unwrap(target, 'request');

    /* istanbul ignore next */
    if (nodeVersion('>=8')) {
      shimmer.unwrap(target, 'get');
    }
  }
}