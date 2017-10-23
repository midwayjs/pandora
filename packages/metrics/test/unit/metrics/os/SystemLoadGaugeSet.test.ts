import {SystemLoadGaugeSet} from '../../../../src/metrics/os/SystemLoadGaugeSet';
import {expect} from 'chai';

const path = require('path');

describe('/test/unit/metrics/os/SystemLoadGaugeSet.test.ts', () => {

  it('get load avg use custom path', () => {
    let metricSet = new SystemLoadGaugeSet(path.join(__dirname, '../resources/proc_load'));
    expect(metricSet.getMetrics().length).to.be.equal(3);
    expect(metricSet.getMetrics()[0].metric.getValue()).to.be.equal(0.37);
    expect(metricSet.getMetrics()[1].metric.getValue()).to.be.equal(0.48);
    expect(metricSet.getMetrics()[2].metric.getValue()).to.be.equal(0.63);
  });
});
