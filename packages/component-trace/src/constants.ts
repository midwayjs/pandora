export enum TraceStatus {
  Normal = 1,
  Slow = 2,
  Unfinished = 4,
  Error = 8
}

export const SPAN_FINISHED = 'span_finished';
export const SPAN_CREATED = 'span_created';
export const TRACE_DATA_DUMP = 'Trace:Data_Dump';