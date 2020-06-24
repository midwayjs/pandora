import {
  Aggregator,
  MetricKind,
  CounterSumAggregator,
  ValueRecorderExactAggregator,
  ObserverAggregator,
  MetricRecord,
  MetricDescriptor,
} from '@opentelemetry/metrics';
import { Batcher } from '@opentelemetry/metrics/build/src/export/Batcher';

/**
 * Batcher which retains all dimensions/labels. It accepts all records and
 * passes them for exporting.
 */
export class PandoraBatcher extends Batcher {
  aggregatorFor(descriptor: MetricDescriptor): Aggregator {
    switch (descriptor.metricKind) {
      case MetricKind.COUNTER:
      case MetricKind.UP_DOWN_COUNTER:
        return new CounterSumAggregator();
      case MetricKind.OBSERVER:
        return new ObserverAggregator();
      default:
        return new ValueRecorderExactAggregator();
    }
  }

  process(record: MetricRecord): void {
    const labels = Object.entries(record.labels)
      .map(it => `${it[0]}=${it[1]}`)
      .join(',');
    this._batchMap.set(record.descriptor.name + labels, record);
  }

  checkPointSet(): MetricRecord[] {
    return Array.from(this._batchMap.values());
  }
}
