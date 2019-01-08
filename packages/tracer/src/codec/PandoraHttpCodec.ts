import { IncomingMessage, ClientRequest, IncomingHttpHeaders } from 'http';
import { consoleLogger } from 'pandora-dollar';
import { PandoraCodec } from './PandoraCodec';
import { PandoraSpanContext } from '../PandoraSpanContext';
import { HEADER_TRACE_ID } from '../constants';
import { getRandom64 } from '../utils';

export class PandoraHttpCodec implements PandoraCodec {
  name = 'http';
  logger = consoleLogger;

  /**
   * 将链路上下文转换到 http 请求头部，向下透传
   * @param context {PandoraSpanContext} - 链路上下文
   * @param carrier {ClientRequest} - http client request
   */
  inject(context: PandoraSpanContext, carrier: ClientRequest): void {
    const traceId = context.traceId;

    carrier.setHeader(HEADER_TRACE_ID, traceId);
  }

  /**
   * 从请求中解析链路上下文
   * @param carrier {IncomingMessage} - 请求
   */
  extract(carrier: IncomingMessage): PandoraSpanContext {
    if (!carrier) return null;

    const headers = carrier.headers || {};

    const traceId = this.getTraceId(headers);
    const context = new PandoraSpanContext({
      traceId
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

  /**
   * 从请求头部获取 traceId
   * @param headers {IncomingHttpHeaders} - 请求头
   * @returns {string} - traceId
   */
  getTraceIdFromHeader(headers: IncomingHttpHeaders): string {
    let traceId: string = String(headers[HEADER_TRACE_ID]);
    traceId = traceId && traceId.trim();

    return traceId;
  }
}