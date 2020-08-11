import * as assert from 'assert';
import { TestMeterProvider } from 'test-util';
import { V8Metric } from '@pandorajs/semantic-conventions';
import { V8HeapGaugeSet } from '../../src/node/V8HeapGaugeSet';

describe('V8HeapGaugeSet', () => {
  it('should get v8 metrics', async () => {
    const meterProvider = new TestMeterProvider();
    const gaugeSet = new V8HeapGaugeSet(meterProvider.getMeter('test'));
    gaugeSet.subscribe();
    // TODO: pulling
    const record = await meterProvider.getMetricRecord(
      V8Metric.HEAP_STAT_HEAP_SIZE_LIMIT
    );

    assert(record.aggregator.toPoint().value > 0);
  });
});
