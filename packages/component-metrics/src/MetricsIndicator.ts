import {IIndicator, IndicatorScope} from 'pandora-component-indicator';
import { MetricRecord, Distribution, Histogram, Point } from '@opentelemetry/metrics';
import { PandoraBatcher } from './Batcher';
const debug = require('debug')('pandora:metrics:MetricsIndicator');

type ValueType<T, K extends keyof T> = T[K]
type PointValue = ValueType<Point, 'value'>

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
    if(query.action === 'list') {
      return this.listMetrics();
    }
  }

  async listMetrics(): Promise<string> {
    let metrics = []
    for (let item of this.batcher.checkPointSet()) {
      const pv = item.aggregator.toPoint().value
      if (isPrimitive(pv)) {
        metrics.push(`${notateMetricRecord(item)} ${pv}`)
      }
      if (isDistribution(pv)) {
        metrics = metrics.concat([
          `${notateMetricRecord(item, 'count')} ${pv.count}`,
          `${notateMetricRecord(item, 'sum')} ${pv.sum}`,
          `${notateMetricRecord(item, 'min')} ${pv.min}`,
          `${notateMetricRecord(item, 'max')} ${pv.max}`,
        ])
      }
      if (isHistogram(pv)) {
        const tmp = [
          `${notateMetricRecord(item, 'count')} ${pv.count}`,
          `${notateMetricRecord(item, 'sum')} ${pv.sum}`,
          pv.buckets.counts.map((val, idx) => `${notateMetricRecord(item, 'bucket', 'le', pv.buckets[idx])} ${val}`)
        ]
        metrics = metrics.concat(tmp)
      }
    }
    return metrics.join('\n')
  }
}

function notateMetricRecord (metric: MetricRecord, suffix?: string, label?: string, labelValue?: any) {
  return `${metric.descriptor.name}${suffix ? '_' + suffix : ''}{${Object.entries(metric.labels).map(entry => `${entry[0]}="${entry[1]}"`).join(', ')}${label ? `, ${label}=${labelValue}`: ''}}`
}

function isDistribution (pv: PointValue): pv is Distribution {
  if ((pv as Distribution).min) {
    return true
  }
  return false
}

function isHistogram (pv: PointValue): pv is Histogram {
  if ((pv as Histogram).buckets) {
    return true
  }
  return false
}

function isPrimitive (pv: PointValue): pv is number {
  if (typeof pv === 'number') {
    return true
  }
  return false
}
