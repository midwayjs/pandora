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
  async shutdown(): Promise<void> {
    await Promise.all(this._metricsExporter.map(it => it.shutdown()));
  }

  addMetricsExporter(exporter: OtelMetricExporter) {
    this._metricsExporter.push(exporter);
  }
}
