import { Span, SpanContext } from 'opentracing';

export interface IPandoraContext extends SpanContext {
  traceId: string;
}

export interface IPandoraSpan extends Span {
  _spanContext: IPandoraContext;
  traceId: string;
  startTime: number;
  duration: number;
  traceName: string;
  context: () => IPandoraContext;
  tagValue: (key: string) => string | number;
  on: (eventName: string, callback: (span: IPandoraSpan) => void) => void;
  emit: (eventName: string, data: any) => void;
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
}