import * as assert from 'assert';
import { LastValueAggregator } from '../src/ComponentMetric';

describe('HistogramAggregator', () => {
  it('.update()', () => {
    const aggregator = new LastValueAggregator();
    aggregator.update(1);
    aggregator.update(5);
    aggregator.update(10);

    const point = aggregator.toPoint();
    assert.strictEqual(point.value, 10);
  });
});
