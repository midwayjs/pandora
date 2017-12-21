import {CpuUsageGaugeSet} from '../../../../src/metrics/os/CpuUsageGaugeSet';
// import {expect} from 'chai';

const path = require('path');

describe('/test/unit/metrics/os/CpuUsageGaugeSet', () => {

  it('should get CPU Usage', () => {
    let gaugeset = new CpuUsageGaugeSet(5000, path.join(__dirname, '../resources/proc_stat'));
    let gauges = gaugeset.getMetrics();

    for (let gauge of gauges) {
      console.log(gauge.metric.getValue().toFixed(4));
    }
  });
});
