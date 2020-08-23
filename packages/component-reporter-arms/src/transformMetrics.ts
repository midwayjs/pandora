import * as api from '@opentelemetry/api';
import {
  groupMetricsByResourceAndLibrary,
  toCollectorLabels,
  toSingularPoint,
  toHistogramPoint,
  toCollectorTemporality,
} from '@opentelemetry/exporter-collector/build/src/transformMetrics';
import {
  MetricRecord,
  MetricKind,
  HistogramAggregator,
  MinMaxLastSumCountAggregator,
} from '@opentelemetry/metrics';
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
  SummaryAggregator,
  HistogramAggregator as PHistogramAggregator,
} from '@pandorajs/component-metric';
import { isSummaryValueType } from './SemanticTranslator';

/**
 * Prepares metric service request to be sent to collector
 * @param metrics metrics
 * @param startTime start time of the metric in nanoseconds
 * @param collectorMetricExporterBase
 */
export function toCollectorExportMetricServiceRequest(
  metrics: MetricRecord[],
  startTime: number,
  serviceName: string,
  attributes?: Attributes
): opentelemetryProto.collector.metrics.v1.ExportMetricsServiceRequest {
  const groupedMetrics: Map<
    Resource,
    Map<InstrumentationLibrary, MetricRecord[]>
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
 * Convert to InstrumentationLibraryMetrics
 * @param instrumentationLibrary
 * @param metrics
 * @param startTime
 */
function toCollectorInstrumentationLibraryMetrics(
  instrumentationLibrary: InstrumentationLibrary,
  metrics: MetricRecord[],
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
  groupedMetrics: Map<Resource, Map<InstrumentationLibrary, MetricRecord[]>>,
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
  metric: MetricRecord,
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
  metric: MetricRecord
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
  if (
    metric.aggregator instanceof HistogramAggregator ||
    metric.aggregator instanceof PHistogramAggregator
  ) {
    return opentelemetryProto.metrics.v1.MetricDescriptorType.HISTOGRAM;
  }
  if (
    metric.aggregator instanceof MinMaxLastSumCountAggregator ||
    metric.aggregator instanceof SummaryAggregator ||
    isSummaryValueType(metric.aggregator.toPoint().value)
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
  metric: MetricRecord
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
 * Returns a SummaryPoint to the collector
 * @param metric
 * @param startTime
 */
export function toSummaryPoint(
  metric: MetricRecord,
  startTime: number
): opentelemetryProto.metrics.v1.SummaryDataPoint {
  const { value, timestamp } = metric.aggregator.toPoint() as {
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
