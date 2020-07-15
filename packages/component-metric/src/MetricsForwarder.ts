import {
  MetricExporter as OtelMetricExporter,
  MetricRecord,
} from '@opentelemetry/metrics';

// TODO: replace with PullController
export class MetricsForwarder implements OtelMetricExporter {
  _metricsExporter: OtelMetricExporter[] = [];

  /** @implements */
  export(metrics: MetricRecord[], resultCallback: (result) => void): void {
    for (const item of this._metricsExporter) {
      item.export(metrics, () => {});
    }
    resultCallback(0);
  }

  /** @implements */
  shutdown(): void {
    for (const item of this._metricsExporter) {
      item.shutdown();
    }
  }

  addMetricsExporter(exporter: OtelMetricExporter) {
    this._metricsExporter.push(exporter);
  }
}
