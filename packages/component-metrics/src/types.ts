import { LogLevel } from '@opentelemetry/core';
import { MetricDescriptor, Point } from '@opentelemetry/metrics'
import { Labels } from '@opentelemetry/api'

/** Default Meter configuration. */
export const DEFAULT_CONFIG = {
  logLevel: LogLevel.INFO,
};

export interface IMetricSnapshot {
  descriptor: MetricDescriptor,
  labels: Labels,
  point: Point
}
