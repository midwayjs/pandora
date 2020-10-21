import { Resource } from '@opentelemetry/resources';

export interface Exception {
  timestamp: number;
  level?: string;

  traceId?: string;
  spanId?: string;
  traceName?: string;

  name?: string;
  message?: string;
  stack?: string;
  attributes?: { [key: string]: string };

  path?: string;
}

export interface ExceptionRecord extends Exception {
  resource: Resource;
}

export interface ExceptionExporter {
  export(logs: ExceptionRecord[]): void;
}
