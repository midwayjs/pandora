import {SystemMemoryGaugeSet} from '../../../../src/metrics/os/SystemMemoryGaugeSet';
import {expect} from 'chai';

const path = require('path');

describe('/test/unit/metrics/os/SystemMemoryGaugeSet.test.ts', () => {

  it('should get system memory statistics', () => {
    let gaugeset = new SystemMemoryGaugeSet(5000, path.join(__dirname, '../resources/meminfo'));
    let gauges = gaugeset.getMetrics();

    expect(gauges[0].name.key).to.equal('mem.total');
    expect(gauges[0].metric.getValue()).to.equal(99163816);

    expect(gauges[1].name.key).to.equal('mem.used');
    expect(gauges[1].metric.getValue()).to.equal(3361884);

    expect(gauges[2].name.key).to.equal('mem.free');
    expect(gauges[2].metric.getValue()).to.equal(89847992);

    expect(gauges[3].name.key).to.equal('mem.buffers');
    expect(gauges[3].metric.getValue()).to.equal(1459900);

    expect(gauges[4].name.key).to.equal('mem.cached');
    expect(gauges[4].metric.getValue()).to.equal(4494040);

    expect(gauges[5].name.key).to.equal('mem.swap.total');
    expect(gauges[5].metric.getValue()).to.equal(2097144);

    expect(gauges[6].name.key).to.equal('mem.swap.used');
    expect(gauges[6].metric.getValue()).to.equal(0);

    expect(gauges[7].name.key).to.equal('mem.swap.free');
    expect(gauges[7].metric.getValue()).to.equal(2097144);


  });
});
