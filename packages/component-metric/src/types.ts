import { LogLevel } from '@opentelemetry/core';
import { Distribution } from '@opentelemetry/metrics';

/** Default Meter configuration. */
export const DEFAULT_CONFIG = {
  logLevel: LogLevel.INFO,
};

export interface SummaryPointValue extends Distribution {
  percentiles: number[];
  values: number[];
}
