import {assert} from 'chai';
import {SystemLoadGaugeSet} from '../../src/os/SystemLoadGaugeSet';

const path = require('path');

describe('/test/unit/metrics/os/SystemLoadGaugeSet.test.ts', () => {
  it('get load avg use custom path', async () => {
    let metricSet = new SystemLoadGaugeSet(5, path.join(__dirname, '../resources/proc_load'));
    assert(metricSet.getMetrics().length === 3);
    assert.isAbove((await metricSet.getMetrics()[0].metric.getValue()), 0);
    assert.isAbove((await metricSet.getMetrics()[1].metric.getValue()), 0);
    assert.isAbove((await metricSet.getMetrics()[2].metric.getValue()), 0);
  });
});
