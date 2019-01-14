import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import * as is from 'is-type-of';
import { consoleLogger } from 'pandora-dollar';
import { IPandoraSpan } from 'pandora-component-trace';
import { URL } from 'url';
import { Patcher } from '../Patcher';
import {
  HttpServerPatcherOptions,
  RequestListener,
  HttpCreateServerOptions,
  HttpServerTags
} from '../domain';
import { extractPath } from '../utils';
import { CURRENT_CONTEXT } from '../constants';

export class HttpServerPatcher extends Patcher {
  protected options: HttpServerPatcherOptions;
  protected _moduleName = 'httpServer';

  target() {
    return http;
  }

  requestFilter(req: IncomingMessage): boolean {
    const requestFilter = this.options.requestFilter;

    if (requestFilter && is.function(requestFilter)) {
      return requestFilter(req);
    }

    return false;
  }

  wrapCreateServer = (createServer) => {
    const self = this;

    return function wrappedCreateServer(opts?: HttpCreateServerOptions, requestListener?: RequestListener) {
      let _requestListener;
      let withOpts = false;

      // args compatible
      if (opts) {
        if (is.function(opts)) {
          _requestListener = opts;
        } else {
          withOpts = true;
          _requestListener = requestListener;
        }
      }

      if (!_requestListener) {
        consoleLogger.log('[HttpServerPatcher] no requestListener, skip trace.');
        return createServer.apply(null, arguments);
      }

      const bindRequestListener = self.cls.bind(function (req: IncomingMessage, res: ServerResponse) {
        const filtered = self.requestFilter(req);

        if (filtered) {
          consoleLogger.log('[HttpServerPatcher] request filter by requestFilter, skip trace.');
          return _requestListener(req, res);
        }

        self.cls.bindEmitter(req);
        self.cls.bindEmitter(res);

        const span = self.createSpan(req);

        if (!span) {
          consoleLogger.log('[HttpServerPatcher] span is null, skip trace.');
          return _requestListener(req, res);
        }

        let chunks = [];
        self.recordFullUrl(span, req);
        self.recordSearchParams(span, req);
        self.recordBody(req, chunks);

        function onFinishedFactory(eventName: string) {
          return function onFinished() {
            res.removeListener('finish', onFinished);
            req.removeListener('aborted', onFinished);

            if (eventName !== 'aborted' && self.options.recordBody && req.method && req.method.toUpperCase() === 'POST') {
              const body = self.bodyTransformer(Buffer.concat(chunks), req);
              span.log({
                body
              });
            }

            // clear cache
            chunks = null;
            span.setTag('http.aborted', eventName === 'aborted');
            const statusCode = res.statusCode;
            span.setTag('http.status_code', statusCode);
            if (statusCode >= 400) {
              span.error(true);
            } else {
              span.error(false);
            }
            span.finish();
          };
        }

        res.once('finish', onFinishedFactory('finish'));
        req.once('aborted', onFinishedFactory('aborted'));

        return _requestListener(req, res);
      });

      const args = withOpts ? [opts, bindRequestListener] : [bindRequestListener];
      return createServer.apply(null, args);
    };
  }

  createSpan(req: IncomingMessage): IPandoraSpan {
    const tracer = this.tracer;

    if (!tracer) {
      return null;
    }

    const context = tracer.extract('http', req);
    const tags = this.buildTags(req);
    let traceName = `HTTP:${tags['http.method']}:${tags['http.pathname']}`;

    if (this.options.traceName && is.function(this.options.traceName)) {
      traceName = this.options.traceName(tags);
    }

    context.traceName = traceName;

    const span = tracer.startSpan(this.moduleName, {
      childOf: context,
      tags,
      startTime: Date.now()
    });

    this.cls.set(CURRENT_CONTEXT, span.context());

    return span;
  }

  buildTags(req: IncomingMessage): HttpServerTags {

    return {
      'http.method': req.method.toUpperCase(),
      'http.pathname': extractPath(req.url),
      'http.client': false,
      is_entry: true
    };
  }

  getFullUrl(req: IncomingMessage): string {
    if (!req) return '';

    let secure = false;

    try {
      secure = (<any>req.connection).encrypted || req.headers[ 'x-forwarded-proto' ] === 'https';
    } catch (error) {
      consoleLogger.error('[HttpServerPatcher] check secure failed when record full url. ', error);
    }

    return 'http' + (secure ? 's' : '') + '://' +
      req.headers.host +
      req.url;
  }

  recordFullUrl(span: IPandoraSpan, req: IncomingMessage): void {
    if (this.options.recordFullUrl) {
      const fullUrl = this.getFullUrl(req);

      span.log({
        fullUrl
      });
    }
  }

  recordSearchParams(span: IPandoraSpan, req: IncomingMessage): void {
    if (this.options.recordSearchParams) {
      const uri = req.url;

      if (uri) {
        let parsed;

        try {
          parsed = new URL(uri);
        } catch (error) {
          consoleLogger.error('[HttpServerPatcher] record search params error. ', error);
          return;
        }

        const searchParams = parsed.searchParams;
        const result = {};

        for (const [name, value] of searchParams) {
          result[name] = value;
        }

        span.log({
          searchParams: result
        });
      }
    }
  }

  recordBody(req: IncomingMessage, chunks: any[]): void {
    const method = req.method;
    const self = this;

    if (this.options.recordBody && method && method.toUpperCase() === 'POST') {
      // 不能直接监听 data 事件，流数据一旦被消费就没有了，会导致后续无法正常获取数据
      this.shimmer.wrap(req, 'emit', function wrapRequestEmit(emit) {
        const bindRequestEmit = self.cls.bind(emit);

        return function wrappedRequestEmit(this: IncomingMessage, event: string) {
          if (event === 'data') {
            const chunk = arguments[1] || [];

            chunks.push(chunk);
          }

          return bindRequestEmit.apply(this, arguments);
        };
      });
    }
  }

  bodyTransformer(buffer: Buffer, req?: IncomingMessage): string {
    const bodyTransformer = this.options.bodyTransformer;

    try {
      if (bodyTransformer && is.function(bodyTransformer)) {
        return bodyTransformer(buffer, req);
      } else {
        return buffer.toString('utf8');
      }
    } catch (error) {
      consoleLogger.error('[HttpServerPatcher] transform body data error. ', error);
      return '';
    }
  }

  attach() {
    this.init();
    const shimmer = this.shimmer;
    const target = this.target();

    consoleLogger.log(`[HttpServerPatcher] patching http createServer.`);
    shimmer.wrap(target, 'createServer', this.wrapCreateServer);
  }

  unattach() {
    const shimmer = this.shimmer;
    const target = this.target();
    shimmer.unwrap(target, 'createServer');
  }
}