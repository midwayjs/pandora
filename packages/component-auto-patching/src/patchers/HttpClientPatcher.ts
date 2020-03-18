import { Patcher } from '../Patcher';
import * as http from 'http';
import * as https from 'https';
import { RequestOptions, ClientRequest, Agent } from 'http';
import { URL, parse } from 'url';
import {
  HttpClientPatcherOptions,
  HttpRequestCallback,
  HttpClientTags,
  ExIncomingMessage
} from '../domain';
import { nodeVersion, urlToOptions, recordError, isURL, setInternalProperty } from '../utils';
import { IPandoraSpan } from 'pandora-component-trace';
import { CURRENT_CONTEXT, DEFAULT_HOST, DEFAULT_PORT, DEFAULT_PROTOCOL, DEFAULT_PATH } from '../constants';

export class HttpClientPatcher extends Patcher {
  protected options: HttpClientPatcherOptions;
  protected _moduleName = 'httpClient';
  protected _spanName = 'http-client';
  protected patchHttps: boolean = nodeVersion('<0.11 || >=9.0.0 || 8.9.0');
  protected _tagPrefix = 'http';

  target() {
    return {
      http,
      https
    };
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
        this.logger.info('[HttpClientPatcher] URL parse failed, use origin parse. ', error);
        _url = parse(url);
      }
    } else if (url && url instanceof URL) {
      _url = urlToOptions(url);
    } else {
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
        self.logger.info('[HttpClientPatcher] span is null, skip trace.');
        return request.apply(null, arguments);
      }

      const _request = request.apply(null, arguments);

      // 追加请求前的 tags
      const args = self.argsCompatible(url, options, cb);
      const staticTags = self.staticTags(args, _request);
      span.addTags(staticTags);
      self.recordFullUrl(span, args);
      self.tracing(span, _request);

      self.wrapRequest(span, _request);

      return _request;
    };
  }

  createSpan(): IPandoraSpan {
    const tracer = this.tracer;

    if (!tracer) {
      this.logger.info('[HttpClientPatcher] no tracer, skip trace.');
      return null;
    }

    // 一律视为 http server 的子节点，不做层级处理，因为难以确认最终调用结束
    const context = this.cls.get(CURRENT_CONTEXT);

    if (!context) {
      this.logger.info('[HttpClientPatcher] no current context, skip trace.');
      return null;
    }

    const tags = {
      [this.tagName('client')]: true,
      is_entry: false
    };

    const span = tracer.startSpan(this.spanName, {
      childOf: context,
      tags,
      startTime: Date.now()
    });

    return span;
  }

  staticTags(options: RequestOptions, clientRequest: ClientRequest): HttpClientTags {

    return {
      // use 'GET' default, like node.js
      [this.tagName('method')]: (options.method || 'GET').toUpperCase(),
      [this.tagName('hostname')]: options.hostname || options.host || DEFAULT_HOST,
      // defaultPort: https://github.com/nodejs/node/blob/eb664c3b6df2ec618fa1c9339dbd418e858bfcfa/lib/_http_agent.js#L48
      [this.tagName('port')]: options.port || options._defaultAgent && (options._defaultAgent as Agent & { defaultPort: number }).defaultPort || DEFAULT_PORT,
      // use '/' default, like node.js
      [this.tagName('pathname')]: options.path || DEFAULT_PATH,
      // TODO: get request size
      [this.tagName('request_size')]: 0
    };
  }

  getFullUrl(options: RequestOptions, defaultProtocol: string): string {
    let path;

    if (isURL(options)) {
      // pathname only exists on a URL object.
      path = options.pathname;
    } else {
      const agent = options._defaultAgent as Agent & {protocol?: string};

      if (agent) {
        defaultProtocol = agent.protocol || defaultProtocol;
      }

      // path only exists on a ClientRequestArgs object.
      path = options.path || DEFAULT_PATH;
    }

    const protocol = options.protocol || defaultProtocol;
    const host = options.hostname || options.host || 'localhost';
    const portString = options.port ? (':' + options.port) : '';

    // In theory we should use url.format here. However, that is
    // broken. See: https://github.com/joyent/node/issues/9117 and
    // https://github.com/nodejs/io.js/pull/893
    // Let's do things the same way _http_client does it.
    return `${protocol}//${host}${portString}${path}`;
  }

  recordFullUrl(span: IPandoraSpan, options: RequestOptions): void {
    if (!this.options.recordFullUrl) return;

    const fullUrl = this.getFullUrl(options, DEFAULT_PROTOCOL);

    span.log({
      fullUrl
    });
  }

  tracing(span: IPandoraSpan, clientRequest: ClientRequest): void {
    if (!this.options.tracing) return;

    const context = span.context();

    try {
      this.tracer.inject(context, 'http', clientRequest);
    } catch (error) {
      this.logger.info('[HttpClientPatcher] inject tracing context to headers error. ', error);
    }
  }

  wrapRequest(span: IPandoraSpan, clientRequest: ClientRequest): void {
    const self = this;

    this.shimmer.wrap(clientRequest, 'emit', function requestEmitWrapper(emit) {
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
    if (!span) return;

    span.error(true);
    this._handleRequestError(span, error);
    span.finish();
  }

  _handleRequestError(span: IPandoraSpan, error: Error): void {
    span.setTag(this.tagName('status_code'), -1);

    recordError(span, error, this.recordErrorDetail);
  }

  handleResponse(span: IPandoraSpan, res: ExIncomingMessage): void {
    const self = this;

    setInternalProperty(res, '__responseSize__', 0, true);
    setInternalProperty(res, '__chunks__', [], true);

    this.shimmer.wrap(res, 'emit', function wrapResponseEmit(emit) {
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
          res.__responseSize__ += chunk.length;

          self.recordResponse(chunk, res);
        }

        return bindResponseEmit.apply(this, arguments);
      };
    });
  }

  recordResponse(chunk: any, res: ExIncomingMessage): void {
    if (!this.options.recordResponse) return;

    const size = this.responseSize(res);

    if (size <= this.options.maxResponseSize) {
      res.__chunks__.push(chunk);
    } else {
      this.logger.info('[HttpClientPatcher] response size greater than maxResponseSize, ignore chunk.');
    }
  }

  exportResponse(span: IPandoraSpan, res: ExIncomingMessage) {
    if (this.options.recordResponse) {
      const chunks = res.__chunks__;
      const response = this.responseTransformer(Buffer.concat(chunks), res);

      span.log({
        response
      });
    }

    // 清除记录
    delete res.__responseSize__;
    delete res.__chunks__;
  }

  _handleResponse(span: IPandoraSpan, res: ExIncomingMessage) {
    const socket = res.socket;
    const remoteIp = socket ? (socket.remoteAddress ? `${socket.remoteAddress}:${socket.remotePort}` : '') : '';
    const responseSize = this.responseSize(res);

    span.setTag(this.tagName('status_code'), res.statusCode);
    span.setTag(this.tagName('remote_ip'), remoteIp);
    span.setTag(this.tagName('response_size'), responseSize || 0);
  }

  responseTransformer(buffer: Buffer, res?: ExIncomingMessage): string {
    const responseTransformer = this.options.responseTransformer;

    try {
      return responseTransformer && responseTransformer(buffer, res) || buffer.toString('utf8');
    } catch (error) {
      this.logger.info('[HttpClientPatcher] transform response data error. ', error);
      return '';
    }
  }

  responseSize(res: ExIncomingMessage): number {
    if (res.headers && res.headers['content-length']) {
      return parseInt(res.headers['content-length'], 10);
    } else {
      return res.__responseSize__;
    }
  }

  wrap(target: any) {
    this.shimmer.wrap(target, 'request', this.httpRequestWrapper);

    /* istanbul ignore next */
    if (nodeVersion('>=8')) {
      this.shimmer.wrap(target, 'get', this.httpRequestWrapper);
    }
  }

  unwrap(target: any) {
    this.shimmer.unwrap(target, 'request');

    /* istanbul ignore next */
    if (nodeVersion('>=8')) {
      this.shimmer.unwrap(target, 'get');
    }
  }

  attach() {
    const target = this.target();

    this.logger.info(`[HttpClientPatcher] patching http client [request].`);
    this.wrap(target.http);

    if (this.patchHttps || this.options.forcePatchHttps) {
      this.logger.info(`[HttpClientPatcher] patching https client [request].`);
      this.wrap(target.https);
    }
  }

  unattach() {
    const target = this.target();
    this.unwrap(target.http);

    /* istanbul ignore next */
    if (this.patchHttps || this.options.forcePatchHttps) {
      this.unwrap(target.https);
    }
  }
}