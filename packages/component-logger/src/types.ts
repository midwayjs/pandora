import { Resource } from '@opentelemetry/resources';

export interface ExceptionRecord {
  timestamp: number;
  level?: string;

  traceId?: string;
  spanId?: string;
  traceName?: string;
  resource?: Resource;

  name?: string;
  message?: string;
  stack?: string;
  attributes?: { [key: string]: string };

  path?: string;
}

export interface ExceptionExporter {
  export(logs: ExceptionRecord[]): void;
}
