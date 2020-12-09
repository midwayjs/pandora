import {
  Aggregator,
  MetricKind,
  MetricRecord,
  MetricDescriptor,
  SumAggregator,
  LastValueAggregator,
  HistogramAggregator,
} from '@opentelemetry/metrics';
import { Batcher } from '@opentelemetry/metrics/build/src/export/Batcher';

/**
 * Batcher which retains all dimensions/labels. It accepts all records and
 * passes them for exporting.
 */
export class PandoraBatcher extends Batcher {
  aggregatorFor(descriptor: MetricDescriptor): Aggregator {
    const histogram = descriptor.description.match(
      /histogram{((?:[\d.]+,?)+)}/
    );
    if (histogram) {
      return new HistogramAggregator(histogram[1].split(',').map(Number));
    }
    switch (descriptor.metricKind) {
      case MetricKind.COUNTER:
      case MetricKind.UP_DOWN_COUNTER:
      case MetricKind.SUM_OBSERVER:
      case MetricKind.UP_DOWN_SUM_OBSERVER:
        return new SumAggregator();
      case MetricKind.VALUE_RECORDER:
      case MetricKind.VALUE_OBSERVER:
        return new LastValueAggregator();
      default:
        return new LastValueAggregator();
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
