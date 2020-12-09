import {
  Aggregator,
  MetricRecord,
  LastValueAggregator,
} from '@opentelemetry/metrics';
import { Batcher } from '@opentelemetry/metrics/build/src/export/Batcher';

/**
 * Batcher which retains all dimensions/labels. It accepts all records and
 * passes them for exporting.
 */
export class TestBatcher extends Batcher {
  aggregatorFor(): Aggregator {
    return new LastValueAggregator();
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
