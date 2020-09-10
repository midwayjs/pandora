import { SummaryAggregator, isSummaryValueType } from '../src/ComponentMetric';
import * as assert from 'assert';

describe('SummaryAggregator', () => {
  it('.update()', () => {
    const aggregator = new SummaryAggregator([0.5, 0.75, 0.95]);
    aggregator.update(1);
    aggregator.update(5);
    aggregator.update(10);

    const point = aggregator.toPoint();
    assert(typeof point.value === 'object');
    assert(isSummaryValueType(point.value));
    assert.strictEqual(point.value.count, 3);
    assert.strictEqual(point.value.max, 10);
    assert.strictEqual(point.value.min, 1);
    assert.strictEqual(point.value.sum, 16);
    assert.deepStrictEqual(point.value.percentiles, [0.5, 0.75, 0.95]);
    assert.deepStrictEqual(point.value.values, [5, 8.75, 10]);
  });
});
