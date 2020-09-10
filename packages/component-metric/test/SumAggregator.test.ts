import * as assert from 'assert';
import { SumAggregator } from '../src/SumAggregator';

describe('SumAggregator', () => {
  it('.update()', () => {
    const aggregator = new SumAggregator();
    aggregator.update(1);
    aggregator.update(5);
    aggregator.update(10);

    const point = aggregator.toPoint();
    assert.strictEqual(point.value, 16);
  });
});
