import { IIndicator, IndicatorScope } from '@pandorajs/component-indicator';
import {
  MetricRecord,
  Histogram,
  PointValueType,
} from '@opentelemetry/metrics';
import { PandoraBatcher } from './Batcher';

export interface MetricsIndicatorInvokeQuery {
  action: 'list';
}

export class MetricsIndicator implements IIndicator {
  /** @implements */
  group = 'metrics';
  /** @implements */
  scope = IndicatorScope.PROCESS;

  constructor(private batcher: PandoraBatcher) {}

  /** @implements */
  async invoke(query: MetricsIndicatorInvokeQuery) {
    if (query.action === 'list') {
      return this.listMetrics();
    }
  }

  async listMetrics(): Promise<string> {
    let metrics = [];
    for (const item of this.batcher.checkPointSet()) {
      const pv = item.aggregator.toPoint().value;
      if (isPrimitive(pv)) {
        metrics.push(`${notateMetricRecord(item)} ${pv}`);
      }
      if (isHistogram(pv)) {
        const tmp = [
          `${notateMetricRecord(item, 'count')} ${pv.count}`,
          `${notateMetricRecord(item, 'sum')} ${pv.sum}`,
          pv.buckets.counts.map(
            (val, idx) =>
              `${notateMetricRecord(
                item,
                'bucket',
                'le',
                pv.buckets[idx]
              )} ${val}`
          ),
        ];
        metrics = metrics.concat(tmp);
      }
    }
    return metrics.join('\n');
  }
}

function notateMetricRecord(
  metric: MetricRecord,
  suffix?: string,
  label?: string,
  labelValue?: unknown
) {
  return `${metric.descriptor.name}${
    suffix ? '_' + suffix : ''
  }{${Object.entries(metric.labels)
    .map(entry => `${entry[0]}="${entry[1]}"`)
    .join(', ')}${label ? `, ${label}=${labelValue}` : ''}}`;
}

function isHistogram(pv: PointValueType): pv is Histogram {
  if ((pv as Histogram).buckets) {
    return true;
  }
  return false;
}

function isPrimitive(pv: PointValueType): pv is number {
  if (typeof pv === 'number') {
    return true;
  }
  return false;
}
