import {expect} from 'chai';
import {DiskStatGaugeSet} from '../../../../src';

describe('/test/unit/metrics/os/DiskStatGaugeSet.test.ts', () => {

    it('should get disk information', async () => {
        let gaugeset = new DiskStatGaugeSet();
        let gauges = gaugeset.getMetrics();
        expect(await gauges[0].metric.getValue() > 0).to.be.true;
        expect(await gauges[1].metric.getValue() > 0).to.be.true;
        expect(await gauges[2].metric.getValue() > 0).to.be.true;
    });
});
