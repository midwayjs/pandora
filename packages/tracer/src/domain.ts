import { PandoraSpan } from './PandoraSpan';
import { PandoraSpanContext } from './PandoraSpanContext';
import { PandoraReference } from './PandoraReference';

export type Baggage = Map<string, string>;
export type Tag = { type: string, value: any };
export type LogItem = { key: string, value: string };
export type LogData = { timestamp: number, fields: LogItem[] };

export interface SpanOptions {
  childOf?: PandoraSpan | PandoraSpanContext;
  references?: PandoraReference[];
  tags?: {
      rpc_type?: number;
      [key: string]: any;
  };
  startTime?: number;
}

export interface ContextOptions {
  traceId?: string;
  baggage?: Baggage;
  parentId?: string;
  spanId?: string;
  traceName?: string;
}