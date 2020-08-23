import { Batcher } from '@opentelemetry/metrics';
import {
  IIndicator,
  IndicatorScope,
  IndicatorManager,
} from '@pandorajs/component-indicator';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import SemanticTranslator from './SemanticTranslator';
import { Labels } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { toCollectorMetric } from './transformMetrics';

export interface ArmsIndicatorInvokeQuery {
  action: 'list';
}

type NumberDataPoint =
  | opentelemetryProto.metrics.v1.Int64DataPoint
  | opentelemetryProto.metrics.v1.DoubleDataPoint;
type DataPoint =
  | NumberDataPoint
  | opentelemetryProto.metrics.v1.HistogramDataPoint
  | opentelemetryProto.metrics.v1.SummaryDataPoint;

export default class ArmsIndicator implements IIndicator {
  /** @implements */
  group = 'arms';
  /** @implements */
  scope = IndicatorScope.PROCESS;
  /** unix nano */
  startTime = Date.now() * 1000;

  private translator = new SemanticTranslator();

  constructor(
    private batcher: Batcher,
    private indicatorManager: IndicatorManager,
    private resource: Resource = new Resource({}),
    private additionalLabels: Labels = {}
  ) {}

  /** @implements */
  async invoke(query: ArmsIndicatorInvokeQuery) {
    if (query.action === 'list') {
      let records = this.batcher.checkPointSet();
      records = this.translator.translate(records);
      records = records.map(it => ({
        ...it,
        labels: { ...it.labels, ...this.additionalLabels },
      }));
      const collectorMetric = records.map(it =>
        toCollectorMetric(it, this.startTime)
      );
      return collectorMetric;
    }
  }

  async getResourceMetrics(): Promise<
    opentelemetryProto.metrics.v1.ResourceMetrics
  > {
    const result = await this.indicatorManager.invokeAllProcesses(this.group, {
      action: 'list',
    });
    const collectorMetrics = result.reduce(
      (accu, item) => accu.concat(item.data),
      [] as opentelemetryProto.metrics.v1.Metric[]
    );
    const aggregatedMetrics = this.aggregateMetrics(collectorMetrics);

    return {
      resource: toCollectorResource(this.resource),
      instrumentationLibraryMetrics: [
        {
          metrics: aggregatedMetrics,
        },
      ],
    };
  }

  /**
   * @internal
   * @param metrics
   */
  aggregateMetrics(metrics: opentelemetryProto.metrics.v1.Metric[]) {
    const aggregateMap = new Map<
      string,
      {
        descriptor: opentelemetryProto.metrics.v1.MetricDescriptor;
        labelMap: Map<string, DataPoint>;
      }
    >();
    for (const metric of metrics) {
      let it = aggregateMap.get(metric.metricDescriptor.name);
      if (it == null) {
        it = {
          descriptor: metric.metricDescriptor,
          labelMap: new Map(),
        };
        aggregateMap.set(metric.metricDescriptor.name, it);
      }
      const dataPoints = this.getDataPoints(metric);
      for (const dp of dataPoints) {
        const key = this.getLabelIndexKey(dp);
        const adp = it.labelMap.get(key);
        if (adp == null) {
          it.labelMap.set(key, dp);
          continue;
        }
        it.labelMap.set(key, this.mergeDataPoint(adp, dp));
      }
    }

    const aggregatedMetrics: opentelemetryProto.metrics.v1.Metric[] = [];
    for (const { descriptor, labelMap } of aggregateMap.values()) {
      if (
        descriptor.type ===
        opentelemetryProto.metrics.v1.MetricDescriptorType.HISTOGRAM
      ) {
        aggregatedMetrics.push({
          metricDescriptor: descriptor,
          histogramDataPoints: Array.from(
            labelMap.values()
          ) as opentelemetryProto.metrics.v1.HistogramDataPoint[],
        });
      }
      if (
        descriptor.type ===
        opentelemetryProto.metrics.v1.MetricDescriptorType.SUMMARY
      ) {
        aggregatedMetrics.push({
          metricDescriptor: descriptor,
          summaryDataPoints: Array.from(
            labelMap.values()
          ) as opentelemetryProto.metrics.v1.SummaryDataPoint[],
        });
      }
      if (
        descriptor.type ===
          opentelemetryProto.metrics.v1.MetricDescriptorType.DOUBLE ||
        descriptor.type ===
          opentelemetryProto.metrics.v1.MetricDescriptorType.MONOTONIC_DOUBLE
      ) {
        aggregatedMetrics.push({
          metricDescriptor: descriptor,
          doubleDataPoints: Array.from(
            labelMap.values()
          ) as opentelemetryProto.metrics.v1.DoubleDataPoint[],
        });
      }
      if (
        descriptor.type ===
          opentelemetryProto.metrics.v1.MetricDescriptorType.INT64 ||
        descriptor.type ===
          opentelemetryProto.metrics.v1.MetricDescriptorType.MONOTONIC_INT64
      ) {
        aggregatedMetrics.push({
          metricDescriptor: descriptor,
          int64DataPoints: Array.from(
            labelMap.values()
          ) as opentelemetryProto.metrics.v1.Int64DataPoint[],
        });
      }
    }

    return aggregatedMetrics;
  }

  private getLabelIndexKey(dataPoint: DataPoint): string {
    let index = '';
    for (const { key, value } of dataPoint.labels) {
      index = index + `${key}\0${value}\n`;
    }
    return index;
  }

  private getDataPoints(
    metric: opentelemetryProto.metrics.v1.Metric
  ): DataPoint[] {
    return (
      metric.int64DataPoints ??
      metric.doubleDataPoints ??
      metric.histogramDataPoints ??
      metric.summaryDataPoints
    );
  }

  private mergeDataPoint(lhs: DataPoint, rhs: DataPoint): DataPoint {
    if (isSummaryDataPoint(lhs) && isSummaryDataPoint(rhs)) {
      return {
        ...lhs,
        count: lhs.count + rhs.count,
        sum: lhs.sum + rhs.sum,
        percentileValues: lhs.percentileValues.map(it => {
          return {
            ...it,
            // TODO:
            value:
              (it.value +
                rhs.percentileValues.find(
                  rit => rit.percentile === it.percentile
                ).value) /
              2,
          };
        }),
      };
    }
    if (isHistogramDataPoint(lhs) && isHistogramDataPoint(rhs)) {
      return {
        ...lhs,
        count: lhs.count + rhs.count,
        sum: lhs.sum + rhs.sum,
        buckets: lhs.buckets.map((it, idx) => {
          return {
            count: it.count + rhs.buckets[idx].count,
          };
        }),
        explicitBounds: lhs.explicitBounds,
      };
    }
    if (isNumberDataPoints(lhs) && isNumberDataPoints(rhs)) {
      return {
        ...lhs,
        value: lhs.value + rhs.value,
      };
    }
    return lhs;
  }
}

function isNumberDataPoints(dp: DataPoint): dp is NumberDataPoint {
  return typeof (dp as NumberDataPoint).value === 'number';
}

function isHistogramDataPoint(
  dp: DataPoint
): dp is opentelemetryProto.metrics.v1.HistogramDataPoint {
  return (
    Array.isArray(
      (dp as opentelemetryProto.metrics.v1.HistogramDataPoint).buckets
    ) ||
    Array.isArray(
      (dp as opentelemetryProto.metrics.v1.HistogramDataPoint).explicitBounds
    )
  );
}

function isSummaryDataPoint(
  dp: DataPoint
): dp is opentelemetryProto.metrics.v1.SummaryDataPoint {
  return Array.isArray(
    (dp as opentelemetryProto.metrics.v1.SummaryDataPoint).percentileValues
  );
}
