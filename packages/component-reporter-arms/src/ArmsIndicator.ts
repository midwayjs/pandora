import { Batcher } from '@opentelemetry/metrics';
import {
  IIndicator,
  IndicatorScope,
  IndicatorManager,
} from '@pandorajs/component-indicator';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import SemanticTranslator from './SemanticTranslator';
import { Resource } from '@opentelemetry/resources';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { AggregationTemporality, PlainMetricRecord } from './types';
import { toCollectorMetric } from './transformMetrics';
import createDebug from 'debug';

const debug = createDebug('pandora:ArmsIndicator');

export interface ArmsIndicatorInvokeQuery {
  action: 'list';
}

type DataPointType =
  | 'intGauge'
  | 'doubleGauge'
  | 'intSum'
  | 'doubleSum'
  | 'intHistogram'
  | 'doubleHistogram';

const DataPointTypes: DataPointType[] = [
  'intGauge',
  'doubleGauge',
  'intSum',
  'doubleSum',
  'intHistogram',
  'doubleHistogram',
];

type DataPoint =
  | opentelemetryProto.metrics.v1.DataPoint
  | opentelemetryProto.metrics.v1.HistogramDataPoint;

export class ArmsBasicIndicator implements IIndicator {
  /** @implements */
  public group = 'arms';
  /** @implements */
  public scope = IndicatorScope.PROCESS;

  constructor(
    protected batcher: Batcher,
    protected indicatorManager: IndicatorManager,
    protected resource: Resource = new Resource({})
  ) {}

  /** @implements */
  async invoke(
    query: ArmsIndicatorInvokeQuery
  ): Promise<PlainMetricRecord[] | undefined> {
    if (query.action === 'list') {
      const records = this.batcher.checkPointSet();
      return records.map(it => {
        return {
          descriptor: it.descriptor,
          instrumentationLibrary: it.instrumentationLibrary,
          labels: it.labels,
          aggregatorKind: it.aggregator.kind,
          point: it.aggregator.toPoint(),
          resource: it.resource,
        };
      });
    }
    return undefined;
  }
}

export default class ArmsIndicator extends ArmsBasicIndicator {
  /** unix nano */
  startTime = Date.now() * 1000;

  constructor(
    batcher: Batcher,
    indicatorManager: IndicatorManager,
    private translator: SemanticTranslator,
    resource: Resource = new Resource({})
  ) {
    super(batcher, indicatorManager, resource);
  }

  async getResourceMetrics(): Promise<
    opentelemetryProto.metrics.v1.ResourceMetrics
  > {
    const result = await this.indicatorManager.invokeAllProcesses(this.group, {
      action: 'list',
    });

    let records = result.reduce(
      (accu, item) => accu.concat(item.data),
      [] as PlainMetricRecord[]
    );
    records = this.translator.translate(records);

    const collectorMetrics = records.map(it =>
      toCollectorMetric(it, this.startTime)
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
  private aggregateMetrics(metrics: opentelemetryProto.metrics.v1.Metric[]) {
    const aggregateMap = new Map<
      string,
      {
        metric: opentelemetryProto.metrics.v1.Metric;
        temporality: AggregationTemporality;
        monotonic: boolean;
        dataPointMap: Map<string, DataPoint>;
      }
    >();
    for (const metric of metrics) {
      let it = aggregateMap.get(metric.name);
      if (it == null) {
        it = {
          metric,
          temporality: this.getTemporality(metric),
          monotonic: this.getMonotonicity(metric),
          dataPointMap: new Map(),
        };
        debug('metric temporality: %s, %s', metric.name, it.temporality);
        aggregateMap.set(metric.name, it);
      }
      const dataPoints = this.getDataPoints(metric);
      for (const dp of dataPoints) {
        const key = this.getLabelIndexKey(dp);
        const adp = it.dataPointMap.get(key);
        if (adp == null) {
          it.dataPointMap.set(key, dp);
          continue;
        }
        it.dataPointMap.set(key, this.mergeDataPoint(adp, dp, it.temporality));
      }
    }

    const aggregatedMetrics: opentelemetryProto.metrics.v1.Metric[] = [];
    for (const {
      metric,
      temporality,
      monotonic,
      dataPointMap: dataPointMap,
    } of aggregateMap.values()) {
      if (metric.intGauge) {
        aggregatedMetrics.push({
          ...metric,
          intGauge: {
            dataPoints: Array.from(
              dataPointMap.values()
            ) as opentelemetryProto.metrics.v1.DataPoint[],
          },
        });
      }
      if (metric.doubleGauge) {
        aggregatedMetrics.push({
          ...metric,
          doubleGauge: {
            dataPoints: Array.from(
              dataPointMap.values()
            ) as opentelemetryProto.metrics.v1.DataPoint[],
          },
        });
      }
      if (metric.intSum) {
        aggregatedMetrics.push({
          ...metric,
          intSum: {
            dataPoints: Array.from(
              dataPointMap.values()
            ) as opentelemetryProto.metrics.v1.DataPoint[],
            aggregationTemporality: temporality,
            isMonotonic: monotonic,
          },
        });
      }
      if (metric.doubleSum) {
        aggregatedMetrics.push({
          ...metric,
          doubleSum: {
            dataPoints: Array.from(
              dataPointMap.values()
            ) as opentelemetryProto.metrics.v1.DataPoint[],
            aggregationTemporality: temporality,
            isMonotonic: monotonic,
          },
        });
      }
      if (metric.intHistogram) {
        aggregatedMetrics.push({
          ...metric,
          intHistogram: {
            dataPoints: Array.from(
              dataPointMap.values()
            ) as opentelemetryProto.metrics.v1.HistogramDataPoint[],
            aggregationTemporality: temporality,
          },
        });
      }
      if (metric.doubleHistogram) {
        aggregatedMetrics.push({
          ...metric,
          doubleHistogram: {
            dataPoints: Array.from(
              dataPointMap.values()
            ) as opentelemetryProto.metrics.v1.HistogramDataPoint[],
            aggregationTemporality: temporality,
          },
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

  private getTemporality(
    metric: opentelemetryProto.metrics.v1.Metric
  ): AggregationTemporality {
    let temporality;
    for (const key of DataPointTypes) {
      const it = (metric[key] as opentelemetryProto.metrics.v1.Sum)
        ?.aggregationTemporality;
      if (it) {
        temporality = it;
        break;
      }
    }
    return temporality ?? AggregationTemporality.AGGREGATION_TEMPORALITY_DELTA;
  }

  private getMonotonicity(
    metric: opentelemetryProto.metrics.v1.Metric
  ): boolean {
    let monotonic;
    for (const key of ['intSum', 'doubleSum']) {
      const it = (metric[key] as opentelemetryProto.metrics.v1.Sum)
        ?.isMonotonic;
      if (it) {
        monotonic = it;
        break;
      }
    }
    return monotonic ?? false;
  }

  private getDataPoints(
    metric: opentelemetryProto.metrics.v1.Metric
  ): DataPoint[] {
    return (
      metric.intGauge ??
      metric.doubleGauge ??
      metric.intSum ??
      metric.doubleSum ??
      metric.intHistogram ??
      metric.doubleHistogram
    ).dataPoints;
  }

  private mergeDataPoint(
    lhs: DataPoint,
    rhs: DataPoint,
    temporality: AggregationTemporality
  ): DataPoint {
    if (temporality === AggregationTemporality.AGGREGATION_TEMPORALITY_DELTA) {
      return lhs;
    }
    if (isHistogramDataPoint(lhs) && isHistogramDataPoint(rhs)) {
      return {
        ...lhs,
        count: lhs.count + rhs.count,
        sum: lhs.sum + rhs.sum,
        bucketCounts: lhs.bucketCounts.map((it, idx) => {
          return it + rhs.bucketCounts[idx];
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

function isNumberDataPoints(
  dp: DataPoint
): dp is opentelemetryProto.metrics.v1.DataPoint {
  return (
    typeof (dp as opentelemetryProto.metrics.v1.DataPoint).value === 'number'
  );
}

function isHistogramDataPoint(
  dp: DataPoint
): dp is opentelemetryProto.metrics.v1.HistogramDataPoint {
  return (
    Array.isArray(
      (dp as opentelemetryProto.metrics.v1.HistogramDataPoint).bucketCounts
    ) ||
    Array.isArray(
      (dp as opentelemetryProto.metrics.v1.HistogramDataPoint).explicitBounds
    )
  );
}
