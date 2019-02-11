import { IncomingMessage, ClientRequest, IncomingHttpHeaders } from 'http';
import { PandoraCodec } from './PandoraCodec';
import { PandoraSpanContext } from '../PandoraSpanContext';
import { HEADER_TRACE_ID, HEADER_SPAN_ID } from '../constants';
import { getRandom64 } from '../utils';

export class PandoraHttpCodec implements PandoraCodec {
  name = 'http';

  logger: any;
  constructor(ctx) {
    this.logger = ctx.logger;
  }

  /**
   * 将链路上下文转换到 http 请求头部，向下透传
   * @param context {PandoraSpanContext} - 链路上下文
   * @param carrier {ClientRequest} - http client request
   */
  inject(context: PandoraSpanContext, carrier: ClientRequest): void {
    const traceId = context.traceId;
    const spanId = context.spanId;

    const hTraceId = carrier.getHeader(HEADER_TRACE_ID);
    const hSpanId = carrier.getHeader(HEADER_SPAN_ID);

    if (!hTraceId) {
      carrier.setHeader(HEADER_TRACE_ID, traceId);
    } else {
      this.logger.log(`[PandoraHttpCodec] use user define ${HEADER_TRACE_ID}: ${hTraceId}`);
    }

    if (!hSpanId) {
      carrier.setHeader(HEADER_SPAN_ID, spanId);
    } else {
      this.logger.log(`[PandoraHttpCodec] use user define ${HEADER_SPAN_ID}: ${hSpanId}`);
    }
  }

  /**
   * 从请求中解析链路上下文
   * @param carrier {IncomingMessage} - 请求
   */
  extract(carrier: IncomingMessage): PandoraSpanContext {
    if (!carrier) return null;

    const headers = carrier.headers || {};

    const traceId = this.getTraceId(headers);
    const spanId = this.getSpanId(headers);

    const context = new PandoraSpanContext({
      traceId,
      spanId
    });

    return context;
  }

  /**
   * 从请求中获得 traceId
   * 获取顺序：http header -> generate
   * @param parsedUrl {UrlWithParsedQuery} - 请求地址
   * @param headers {IncomingHttpHeaders} - 请求头部
   * @returns {string} - traceId
   */
  getTraceId(headers: IncomingHttpHeaders): string {
    let traceId: string;

    traceId = this.getTraceIdFromHeader(headers);

    traceId = traceId || getRandom64();

    return traceId;
  }

  getSpanId(headers: IncomingHttpHeaders): string {
    let spanId: string;

    spanId = this.getSpanIdFromHeader(headers);

    return spanId;
  }

  /**
   * 从请求头部获取 traceId
   * @param headers {IncomingHttpHeaders} - 请求头
   * @returns {string} - traceId
   */
  getTraceIdFromHeader(headers: IncomingHttpHeaders): string {
    let traceId: any = headers[HEADER_TRACE_ID] || null;
    traceId = traceId && traceId.trim();

    return traceId;
  }

  getSpanIdFromHeader(headers: IncomingHttpHeaders): string {
    let spanId: any = headers[HEADER_SPAN_ID] || null;
    spanId = spanId && spanId.trim();

    return spanId;
  }
}