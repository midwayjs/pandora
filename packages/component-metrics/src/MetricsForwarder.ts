import { MetricExporter, MetricRecord } from '@opentelemetry/metrics'
import { EventEmitter } from 'events'
import { IMetricSnapshot } from './types'

// TODO: replace with PullController
export class MetricsForwarder extends EventEmitter implements MetricExporter {

  /** @implements */
  export(metrics: MetricRecord[], resultCallback: (result) => void): void {
    const snapshots = metrics.map((it) => this.format(it))
    try {
      this.emit('data', snapshots)
    } catch (e) {
      this.emit('error', e)
    }
    resultCallback(0)
  }

  /** @implements */
  shutdown(): void {
    this.emit('end')
  }

  private format(metric: MetricRecord): IMetricSnapshot {
    return {
      descriptor: metric.descriptor,
      labels: metric.labels,
      point: metric.aggregator.toPoint(),
    }
  }
}
