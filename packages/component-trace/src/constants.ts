export enum TraceStatus {
  Normal = 1,
  Slow = 2,
  Unfinished = 4,
  Error = 8
}

export const SPAN_FINISHED = 'Trace:Span_Finished';
export const TRACE_DATA_DUMP = 'Trace:Data_Dump';