import * as api from '@opentelemetry/api';
import { toCollectorLabels } from '@opentelemetry/exporter-collector/build/src/transformMetrics';
import { MetricKind, Histogram, AggregatorKind } from '@opentelemetry/metrics';
import {
  InstrumentationLibrary,
  hrTimeToNanoseconds,
} from '@opentelemetry/core';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import { Resource } from '@opentelemetry/resources';
import { Attributes, HrTime } from '@opentelemetry/api';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { PlainMetricRecord } from './types';

/**
 * Prepares metric service request to be sent to collector
 * @param metrics metrics
 * @param startTime start time of the metric in nanoseconds
 * @param collectorMetricExporterBase
 */
function toCollectorExportMetricServiceRequest(
  metrics: PlainMetricRecord[],
  startTime: number,
  serviceName: string,
  attributes?: Attributes
): opentelemetryProto.collector.metrics.v1.ExportMetricsServiceRequest {
  const groupedMetrics: Map<
    Resource,
    Map<InstrumentationLibrary, PlainMetricRecord[]>
  > = groupMetricsByResourceAndLibrary(metrics);
  const additionalAttributes = Object.assign({}, attributes, {
    'service.name': serviceName,
  });
  return {
    resourceMetrics: toCollectorResourceMetrics(
      groupedMetrics,
      additionalAttributes,
      startTime
    ),
  };
}

/**
 * Takes an array of metrics and groups them by resource and instrumentation
 * library
 * @param metrics metrics
 */
function groupMetricsByResourceAndLibrary(
  metrics: PlainMetricRecord[]
): Map<Resource, Map<InstrumentationLibrary, PlainMetricRecord[]>> {
  return metrics.reduce((metricMap, metric) => {
    //group by resource
    let resourceMetrics = metricMap.get(metric.resource);
    if (!resourceMetrics) {
      resourceMetrics = new Map<InstrumentationLibrary, PlainMetricRecord[]>();
      metricMap.set(metric.resource, resourceMetrics);
    }
    //group by instrumentation library
    let libMetrics = resourceMetrics.get(metric.instrumentationLibrary);
    if (!libMetrics) {
      libMetrics = [];
      resourceMetrics.set(metric.instrumentationLibrary, libMetrics);
    }
    libMetrics.push(metric);
    return metricMap;
  }, new Map<Resource, Map<InstrumentationLibrary, PlainMetricRecord[]>>());
}

/**
 * Convert to InstrumentationLibraryMetrics
 * @param instrumentationLibrary
 * @param metrics
 * @param startTime
 */
function toCollectorInstrumentationLibraryMetrics(
  instrumentationLibrary: InstrumentationLibrary,
  metrics: PlainMetricRecord[],
  startTime: number
): opentelemetryProto.metrics.v1.InstrumentationLibraryMetrics {
  return {
    metrics: metrics.map(metric => toCollectorMetric(metric, startTime)),
    instrumentationLibrary,
  };
}

/**
 * Returns a list of resource metrics which will be exported to the collector
 * @param groupedSpans
 * @param baseAttributes
 */
function toCollectorResourceMetrics(
  groupedMetrics: Map<
    Resource,
    Map<InstrumentationLibrary, PlainMetricRecord[]>
  >,
  baseAttributes: Attributes,
  startTime: number
): opentelemetryProto.metrics.v1.ResourceMetrics[] {
  return Array.from(groupedMetrics, ([resource, libMetrics]) => {
    return {
      resource: toCollectorResource(resource, baseAttributes),
      instrumentationLibraryMetrics: Array.from(
        libMetrics,
        ([instrumentationLibrary, metrics]) =>
          toCollectorInstrumentationLibraryMetrics(
            instrumentationLibrary,
            metrics,
            startTime
          )
      ),
    };
  });
}

/**
 * Converts a metric to be compatible with the collector
 * @param metric
 * @param startTime start time in nanoseconds
 */
export function toCollectorMetric(
  metric: PlainMetricRecord,
  startTime: number
): opentelemetryProto.metrics.v1.Metric {
  const metricCollector: opentelemetryProto.metrics.v1.Metric = {
    name: metric.descriptor.name,
    description: metric.descriptor.description,
    unit: metric.descriptor.unit,
  };

  switch (metric.aggregatorKind) {
    case AggregatorKind.SUM:
      {
        const result = {
          dataPoints: [toSingularPoint(metric, startTime)],
          isMonotonic:
            metric.descriptor.metricKind === MetricKind.COUNTER ||
            metric.descriptor.metricKind === MetricKind.SUM_OBSERVER,
          aggregationTemporality: toAggregationTemporality(metric),
        };
        if (metric.descriptor.valueType === api.ValueType.INT) {
          metricCollector.intSum = result;
        } else {
          metricCollector.doubleSum = result;
        }
      }
      break;

    case AggregatorKind.LAST_VALUE:
      {
        const result = {
          dataPoints: [toSingularPoint(metric, startTime)],
        };
        if (metric.descriptor.valueType === api.ValueType.INT) {
          metricCollector.intGauge = result;
        } else {
          metricCollector.doubleGauge = result;
        }
      }
      break;

    case AggregatorKind.HISTOGRAM:
      {
        const result = {
          dataPoints: [toHistogramPoint(metric, startTime)],
          aggregationTemporality: toAggregationTemporality(metric),
        };
        if (metric.descriptor.valueType === api.ValueType.INT) {
          metricCollector.intHistogram = result;
        } else {
          metricCollector.doubleHistogram = result;
        }
      }
      break;
  }

  return metricCollector;
}

/**
 * Returns a HistogramPoint to the collector
 * @param metric
 * @param startTime
 */
function toHistogramPoint(
  metric: PlainMetricRecord,
  startTime: number
): opentelemetryProto.metrics.v1.HistogramDataPoint {
  const { value, timestamp } = metric.point as {
    value: Histogram;
    timestamp: HrTime;
  };
  return {
    labels: toCollectorLabels(metric.labels),
    sum: value.sum,
    count: value.count,
    startTimeUnixNano: startTime,
    timeUnixNano: hrTimeToNanoseconds(timestamp),
    bucketCounts: value.buckets.counts,
    explicitBounds: value.buckets.boundaries,
  };
}

/**
 * Returns an Int64Point or DoublePoint to the collector
 * @param metric
 * @param startTime
 */
function toSingularPoint(
  metric: PlainMetricRecord,
  startTime: number
): {
  labels: opentelemetryProto.common.v1.StringKeyValue[];
  startTimeUnixNano: number;
  timeUnixNano: number;
  value: number;
} {
  return {
    labels: toCollectorLabels(metric.labels),
    value: metric.point.value as number,
    startTimeUnixNano: startTime,
    timeUnixNano: hrTimeToNanoseconds(metric.point.timestamp),
  };
}

/**
 * Given a MetricDescriptor, return its temporality in a compatible format with the collector
 * @param descriptor
 */
function toAggregationTemporality(
  metric: PlainMetricRecord
): opentelemetryProto.metrics.v1.AggregationTemporality {
  if (
    metric.descriptor.metricKind === MetricKind.COUNTER ||
    metric.descriptor.metricKind === MetricKind.UP_DOWN_COUNTER
  ) {
    return opentelemetryProto.metrics.v1.AggregationTemporality
      .AGGREGATION_TEMPORALITY_CUMULATIVE;
  }

  if (
    metric.descriptor.metricKind === MetricKind.SUM_OBSERVER ||
    metric.descriptor.metricKind === MetricKind.UP_DOWN_SUM_OBSERVER
  ) {
    return opentelemetryProto.metrics.v1.AggregationTemporality
      .AGGREGATION_TEMPORALITY_CUMULATIVE;
  }

  if (metric.descriptor.metricKind === MetricKind.VALUE_OBSERVER) {
    return opentelemetryProto.metrics.v1.AggregationTemporality
      .AGGREGATION_TEMPORALITY_DELTA;
  }

  return opentelemetryProto.metrics.v1.AggregationTemporality
    .AGGREGATION_TEMPORALITY_DELTA;
}
