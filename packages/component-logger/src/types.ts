export interface LogRecord {
  timestamp: number;
  level?: string;
  name?: string;
  message?: string;
  stack?: string;
  traceId?: string;
  path?: string;
}

export interface LogExporter {
  export(logs: LogRecord[]): void;
}
