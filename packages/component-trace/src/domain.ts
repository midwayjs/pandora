import { Span, SpanContext } from 'opentracing';

export interface IPandoraContext extends SpanContext {
  traceId: string;
  traceName: string;
}

export interface IPandoraSpan extends Span {
  _spanContext: IPandoraContext;
  traceId: string;
  startTime: number;
  duration: number;
  traceName: string;
  context: () => IPandoraContext;
  error: (isError: boolean) => IPandoraSpan;
  tag: (key: string) => any;
  on: (eventName: string, callback: (span: IPandoraSpan) => void) => void;
  emit: (eventName: string, data: any) => void;
}

export interface IPandoraReference {}

export interface ISpanOptions {
  childOf?: IPandoraSpan | IPandoraContext;
  references?: IPandoraReference[];
  tags?: {
      rpc_type?: number;
      [key: string]: any;
  };
  startTime?: number;
}

export interface ITracer {
  new(): ITracer;
  extract: (format: string, carrier: any) => IPandoraContext;
  inject: (spanContext: IPandoraContext, format: string, carrier: any) => void;
  startSpan: (operationName: string, options: ISpanOptions) => IPandoraSpan;
  createChildContext: (parent: IPandoraContext) =>  IPandoraContext;
}

export interface TraceManagerOptions {
  // 最多缓存数据数
  poolSize?: number;
  // dump 数据周期，ms
  interval?: number;
  // 慢链路阈值，ms
  slowThreshold?: number;
  // 自定义链路名方法
  traceName?: (span: IPandoraSpan) => string;
  // 自定义 Tracer 实现类
  kTracer?: ITracer;
}