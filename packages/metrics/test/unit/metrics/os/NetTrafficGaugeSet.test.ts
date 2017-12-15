import {NetTrafficGaugeSet} from '../../../../src/metrics/os/NetTrafficGaugeSet';
import {expect} from 'chai';

const path = require('path');

describe('/test/unit/metrics/os/NetTrafficGaugeSet.test.ts', () => {

  it('should get network traffic statistics', () => {
    let gaugeset = new NetTrafficGaugeSet(5000, path.join(__dirname, '../resources/proc_net_dev'));
    let gauges = gaugeset.getMetrics();
    expect(gauges.length).to.equal(112);
    // for (let gauge in gauges) {
    //   console.log(gaiuse);
    // }
  });
});
