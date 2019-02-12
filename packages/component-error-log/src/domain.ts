export interface ErrorLog {
  timestamp: number;
  method?: string;
  errType?: string;
  message?: string;
  stack?: string;
  traceId?: string;
  path?: string;
}

