import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import * as is from 'is-type-of';
import { IPandoraSpan } from 'pandora-component-trace';
import { parse } from 'url';
import { Patcher } from '../Patcher';
import {
  HttpServerPatcherOptions,
  RequestListener,
  HttpCreateServerOptions,
  HttpServerTags
} from '../domain';
import { extractPath, recordError } from '../utils';
import { CURRENT_CONTEXT } from '../constants';

export class HttpServerPatcher extends Patcher {
  protected options: HttpServerPatcherOptions;
  protected _moduleName = 'httpServer';
  protected _spanName = 'http-server';
  protected _tagPrefix = 'http';

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

  argsCompatible(opts?: HttpCreateServerOptions, requestListener?: RequestListener) {
    let _requestListener;
    let withOpts = false;

    /* istanbul ignore next */
    if (opts) {
      if (is.function(opts)) {
        _requestListener = opts;
      } else {
        withOpts = true;
        _requestListener = requestListener;
      }
    }

    return {
      requestListener: _requestListener,
      withOpts
    };
  }

  argsTransform(withOpts: boolean, requestListener?: Function, opts?: HttpCreateServerOptions) {
    return withOpts ? [opts, requestListener] : [requestListener];
  }

  wrapCreateServer = (createServer) => {
    const self = this;

    return function wrappedCreateServer(opts?: HttpCreateServerOptions, requestListener?: RequestListener) {
      let _requestListener;
      let withOpts = false;

      // args compatible
      const argsCompatible = self.argsCompatible(opts, requestListener);
      _requestListener = argsCompatible.requestListener;
      withOpts = argsCompatible.withOpts;

      if (!_requestListener) {
        self.logger.info('[HttpServerPatcher] no requestListener, skip trace.');
        return createServer.apply(null, arguments);
      }

      const bindRequestListener = self.cls.bind(function (req: IncomingMessage, res: ServerResponse) {
        const filtered = self.requestFilter(req);

        if (filtered) {
          self.logger.info('[HttpServerPatcher] request filter by requestFilter, skip trace.');
          return _requestListener(req, res);
        }

        self.cls.bindEmitter(req);
        self.cls.bindEmitter(res);

        const span = self.createSpan(req);

        if (!span) {
          self.logger.info('[HttpServerPatcher] span is null, skip trace.');
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
            span.setTag(self.tagName('aborted'), eventName === 'aborted');
            const statusCode = res.statusCode;
            span.setTag(self.tagName('status_code'), statusCode);
            if (statusCode >= 400) {
              span.error(true);
              recordError(span, new Error(res.statusMessage), self.recordErrorDetail);
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

      const args = self.argsTransform(withOpts, bindRequestListener, opts);
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
    let traceName = `HTTP:${tags[this.tagName('method')]}:${tags[this.tagName('pathname')]}`;

    if (this.options.traceName && is.function(this.options.traceName)) {
      traceName = this.options.traceName(tags);
    }

    context.traceName = traceName;

    const span = tracer.startSpan(this.spanName, {
      childOf: context,
      tags,
      startTime: Date.now()
    });

    this.cls.set(CURRENT_CONTEXT, span.context());

    return span;
  }

  buildTags(req: IncomingMessage): HttpServerTags {

    return {
      [this.tagName('method')]: req.method.toUpperCase(),
      [this.tagName('pathname')]: extractPath(req.url),
      [this.tagName('client')]: false,
      is_entry: true
    };
  }

  getFullUrl(req: IncomingMessage): string {
    if (!req) return '';

    let secure = false;

    try {
      secure = (<any>req.connection).encrypted || req.headers[ 'x-forwarded-proto' ] === 'https';
    } catch (error) {
      this.logger.error('[HttpServerPatcher] check secure failed when record full url. ', error);
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

      /* istanbul ignore next */
      if (uri) {
        let parsed;

        try {
          parsed = parse(uri, true);
        } catch (error) {
          this.logger.error('[HttpServerPatcher] record search params error. ', error);
          return;
        }

        const searchParams = parsed.query;

        span.log({
          searchParams
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
            // may be string or Buffer, not null
            const chunk = arguments[1];
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
      this.logger.error('[HttpServerPatcher] transform body data error. ', error);
      return '';
    }
  }

  attach() {
    const shimmer = this.shimmer;
    const target = this.target();
    this.logger.info(`[HttpServerPatcher] patching http [createServer].`);
    shimmer.wrap(target, 'createServer', this.wrapCreateServer);
  }

  unattach() {
    const shimmer = this.shimmer;
    const target = this.target();
    shimmer.unwrap(target, 'createServer');
  }
}