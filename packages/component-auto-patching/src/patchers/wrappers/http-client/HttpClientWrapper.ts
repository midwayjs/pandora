import { consoleLogger } from 'pandora-dollar';
import {
  HttpClientPatcherOptions,
  HttpRequestCallback,
  HttpClientTags
} from '../../../domain';
import * as shimmer from '../../../Shimmer';
import { nodeVersion, urlToOptions } from '../../../utils';
import { RequestOptions, ClientRequest } from 'http';
import { URL, parse } from 'url';
import { IPandoraSpan } from 'pandora-component-trace';
import { CURRENT_CONTEXT, DEFAULT_HOST } from '../../../constants';
import { Wrapper } from '../Wrapper';

export class HttpClientWrapper extends Wrapper {
  options: HttpClientPatcherOptions;

  wrap(target: any): void {
    shimmer.wrap(target, 'request', this.httpRequestWrapper);

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
        consoleLogger.log('[HttpClientWrapper] URL parse failed, use origin parse. ', error);
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

  httpRequestWrapper(request) {
    const self = this;

    return function wrappedHttpRequest(url: string | URL, options: RequestOptions, cb: HttpRequestCallback): ClientRequest {
      const span = self.createSpan();

      if (!span) {
        consoleLogger.log('[HttpClientWrapper] span is null, skip trace.');
        return request.apply(null, arguments);
      }

      const _request = request.apply(null, arguments);

      const args = self.argsCompatible(url, options, cb);
      self.appendTags(span, args, _request);

      return _request;
    };
  }

  createSpan(): IPandoraSpan {
    const tracer = this.tracer;

    if (!tracer) {
      consoleLogger.log('[HttpClientWrapper] no tracer, skip trace.');
      return null;
    }

    const context = this.cls.get(CURRENT_CONTEXT);

    if (!context) {
      consoleLogger.log('[HttpClientWrapper] no current context, skip trace.');
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

  buildTags(options: RequestOptions, clientRequest: ClientRequest): HttpClientTags {

    return {
      // use 'GET' default, like node.js
      'http.method': (options.method || 'GET').toUpperCase(),
      'http.hostname': options.hostname || options.host || DEFAULT_HOST
    };
  }

  tracing() {}

  appendTags(span: IPandoraSpan, options: RequestOptions, clientRequest: ClientRequest): void {}

  wrapRequest() {}

  unwrap(target: any): void {
    shimmer.unwrap(target, 'request');

    if (nodeVersion('>=8')) {
      shimmer.unwrap(target, 'get');
    }
  }
}