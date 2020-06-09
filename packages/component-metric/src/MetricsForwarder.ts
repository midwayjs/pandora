import {
  MetricExporter as OtelMetricExporter,
  MetricRecord,
} from '@opentelemetry/metrics';
import { MetricSnapshot, MetricsExporter } from './types';

// TODO: replace with PullController
export class MetricsForwarder implements OtelMetricExporter {
  _metricsExporter: MetricsExporter[] = [];

  /** @implements */
  export(metrics: MetricRecord[], resultCallback: (result) => void): void {
    const snapshots: MetricSnapshot[] = [];
    for (const item of metrics) {
      const snapshot = this.format(item);
      if (
        snapshot.point.timestamp[0] === 0 &&
        snapshot.point.timestamp[1] === 0
      ) {
        continue;
      }
      snapshots.push(snapshot);
    }
    for (const item of this._metricsExporter) {
      item.export(snapshots);
    }
    resultCallback(0);
  }

  /** @implements */
  shutdown(): void {
    for (const item of this._metricsExporter) {
      item.shutdown();
    }
  }

  addMetricsExporter(exporter: MetricsExporter) {
    this._metricsExporter.push(exporter);
  }

  private format(metric: MetricRecord): MetricSnapshot {
    return {
      descriptor: metric.descriptor,
      labels: metric.labels,
      point: metric.aggregator.toPoint(),
    };
  }
}
