import * as api from '@opentelemetry/api';
import { toCollectorLabels } from '@opentelemetry/exporter-collector/build/src/transformMetrics';
import { MetricKind, Histogram } from '@opentelemetry/metrics';
import {
  InstrumentationLibrary,
  hrTimeToNanoseconds,
} from '@opentelemetry/core';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import { Resource } from '@opentelemetry/resources';
import { Attributes, HrTime } from '@opentelemetry/api';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import {
  SummaryPointValue,
  isDistributionValueType,
  isSummaryValueType,
  isHistogramValueType,
} from '@pandorajs/component-metric';
import { PlainMetricRecord } from './types';

/**
 * Prepares metric service request to be sent to collector
 * @param metrics metrics
 * @param startTime start time of the metric in nanoseconds
 * @param collectorMetricExporterBase
 */
export function toCollectorExportMetricServiceRequest(
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
export function groupMetricsByResourceAndLibrary(
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
  if (
    toCollectorType(metric) ===
    opentelemetryProto.metrics.v1.MetricDescriptorType.HISTOGRAM
  ) {
    return {
      metricDescriptor: toCollectorMetricDescriptor(metric),
      histogramDataPoints: [toHistogramPoint(metric, startTime)],
    };
  }
  if (
    toCollectorType(metric) ===
    opentelemetryProto.metrics.v1.MetricDescriptorType.SUMMARY
  ) {
    return {
      metricDescriptor: toCollectorMetricDescriptor(metric),
      summaryDataPoints: [toSummaryPoint(metric, startTime)],
    };
  }
  if (metric.descriptor.valueType === api.ValueType.INT) {
    return {
      metricDescriptor: toCollectorMetricDescriptor(metric),
      int64DataPoints: [toSingularPoint(metric, startTime)],
    };
  }
  if (metric.descriptor.valueType === api.ValueType.DOUBLE) {
    return {
      metricDescriptor: toCollectorMetricDescriptor(metric),
      doubleDataPoints: [toSingularPoint(metric, startTime)],
    };
  }

  return {
    metricDescriptor: toCollectorMetricDescriptor(metric),
    int64DataPoints: [],
  };
}

/**
 * TODO:
 * Given a MetricDescriptor, return its type in a compatible format with the collector
 * @param descriptor
 */
export function toCollectorType(
  metric: PlainMetricRecord
): opentelemetryProto.metrics.v1.MetricDescriptorType {
  if (
    metric.descriptor.metricKind === MetricKind.COUNTER ||
    metric.descriptor.metricKind === MetricKind.SUM_OBSERVER
  ) {
    if (metric.descriptor.valueType === api.ValueType.INT) {
      return opentelemetryProto.metrics.v1.MetricDescriptorType.MONOTONIC_INT64;
    }
    return opentelemetryProto.metrics.v1.MetricDescriptorType.MONOTONIC_DOUBLE;
  }
  if (isHistogramValueType(metric.point.value)) {
    return opentelemetryProto.metrics.v1.MetricDescriptorType.HISTOGRAM;
  }
  if (
    isDistributionValueType(metric.point.value) ||
    isSummaryValueType(metric.point.value)
  ) {
    return opentelemetryProto.metrics.v1.MetricDescriptorType.SUMMARY;
  }
  if (metric.descriptor.valueType === api.ValueType.INT) {
    return opentelemetryProto.metrics.v1.MetricDescriptorType.INT64;
  }
  if (metric.descriptor.valueType === api.ValueType.DOUBLE) {
    return opentelemetryProto.metrics.v1.MetricDescriptorType.DOUBLE;
  }

  return opentelemetryProto.metrics.v1.MetricDescriptorType.INVALID_TYPE;
}

/**
 * Given a MetricRecord, return the Collector compatible type of MetricDescriptor
 * @param metric
 */
export function toCollectorMetricDescriptor(
  metric: PlainMetricRecord
): opentelemetryProto.metrics.v1.MetricDescriptor {
  return {
    name: metric.descriptor.name,
    description: metric.descriptor.description,
    unit: metric.descriptor.unit,
    type: toCollectorType(metric),
    temporality: toCollectorTemporality(metric),
  };
}

/**
 * Given a MetricDescriptor, return its temporality in a compatible format with the collector
 * @param descriptor
 */
export function toCollectorTemporality(
  metric: PlainMetricRecord
): opentelemetryProto.metrics.v1.MetricDescriptorTemporality {
  if (
    metric.descriptor.metricKind === MetricKind.COUNTER ||
    metric.descriptor.metricKind === MetricKind.SUM_OBSERVER
  ) {
    return opentelemetryProto.metrics.v1.MetricDescriptorTemporality.CUMULATIVE;
  }
  if (
    metric.descriptor.metricKind === MetricKind.UP_DOWN_COUNTER ||
    metric.descriptor.metricKind === MetricKind.UP_DOWN_SUM_OBSERVER
  ) {
    return opentelemetryProto.metrics.v1.MetricDescriptorTemporality.DELTA;
  }
  if (
    metric.descriptor.metricKind === MetricKind.VALUE_OBSERVER ||
    metric.descriptor.metricKind === MetricKind.VALUE_RECORDER
  ) {
    // TODO: Change once LastValueAggregator is implemented.
    // If the aggregator is LastValue or Exact, then it will be instantaneous
    return opentelemetryProto.metrics.v1.MetricDescriptorTemporality.DELTA;
  }
  return opentelemetryProto.metrics.v1.MetricDescriptorTemporality
    .INVALID_TEMPORALITY;
}

/**
 * Returns a SummaryPoint to the collector
 * @param metric
 * @param startTime
 */
export function toSummaryPoint(
  metric: PlainMetricRecord,
  startTime: number
): opentelemetryProto.metrics.v1.SummaryDataPoint {
  const { value, timestamp } = metric.point as {
    value: SummaryPointValue;
    timestamp: HrTime;
  };

  return {
    labels: toCollectorLabels(metric.labels),
    sum: value.sum,
    count: value.count,
    startTimeUnixNano: startTime,
    timeUnixNano: hrTimeToNanoseconds(timestamp),
    percentileValues: [
      { percentile: 0, value: value.min },
      ...(value.percentiles ?? []).map((it, idx) => ({
        percentile: it * 100,
        value: value.values[idx],
      })),
      { percentile: 100, value: value.max },
    ],
  };
}

/**
 * Returns a HistogramPoint to the collector
 * @param metric
 * @param startTime
 */
export function toHistogramPoint(
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
    buckets: value.buckets.counts.map(count => {
      return { count };
    }),
    explicitBounds: value.buckets.boundaries,
  };
}

/**
 * Returns an Int64Point or DoublePoint to the collector
 * @param metric
 * @param startTime
 */
export function toSingularPoint(
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
