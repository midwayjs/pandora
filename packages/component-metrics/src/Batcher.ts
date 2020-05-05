import { MetricDescriptor, Aggregator, MetricKind, CounterSumAggregator, MeasureExactAggregator, ObserverAggregator, MetricRecord } from '@opentelemetry/metrics'
import { Batcher } from '@opentelemetry/metrics/build/src/export/Batcher'

/**
 * Batcher which retains all dimensions/labels. It accepts all records and
 * passes them for exporting.
 */
export class PandoraBatcher extends Batcher {
  aggregatorFor(metricKind: MetricKind): Aggregator {
    switch (metricKind) {
      case MetricKind.COUNTER:
        return new CounterSumAggregator();
      case MetricKind.OBSERVER:
        return new ObserverAggregator();
      default:
        return new MeasureExactAggregator();
    }
  }

  process(record: MetricRecord): void {
    const labels = record.descriptor.labelKeys
      .map(k => `${k}=${record.labels[k]}`)
      .join(',');
    this._batchMap.set(record.descriptor.name + labels, record);
  }

  checkPointSet(): MetricRecord[] {
    return Array.from(this._batchMap.values());
  }
}
