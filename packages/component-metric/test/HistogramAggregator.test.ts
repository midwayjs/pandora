import * as assert from 'assert';
import {
  HistogramAggregator,
  isHistogramValueType,
} from '../src/HistogramAggregator';

describe('HistogramAggregator', () => {
  it('.update()', () => {
    const aggregator = new HistogramAggregator([2, 8]);
    aggregator.update(1);
    aggregator.update(5);
    aggregator.update(10);

    const point = aggregator.toPoint();
    assert(isHistogramValueType(point.value));
    assert.deepStrictEqual(point.value.buckets.boundaries, [2, 8]);
    assert.deepStrictEqual(point.value.buckets.counts, [1, 1, 1]);
  });
});
