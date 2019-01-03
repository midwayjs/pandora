export type Baggage = Map<string, string>;

export interface SpanOptions {
  childOf?: EagleeyeSpan | EagleeyeContext;
  references?: EagleeyeReference[];
  tags?: {
      rpc_type?: number;
      [key: string]: any;
  };
  startTime?: number;
}