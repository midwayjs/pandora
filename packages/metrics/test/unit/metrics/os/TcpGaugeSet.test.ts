import {NetworkTrafficGaugeSet} from '../../../../src/metrics/os/TcpGaugeSet';
import {expect} from 'chai';

const path = require('path');

describe('/test/unit/metrics/os/TcpGaugeSet.test.ts', () => {

    it('should get tcp statistics', () => {
        let gaugeset = new NetworkTrafficGaugeSet(5000, path.join(__dirname, '../resources/snmp'));
        let gauges = gaugeset.getMetrics();
        expect(gauges[0].metric.getValue()).to.equal(21983);
        expect(gauges[1].metric.getValue()).to.equal(748);
        expect(gauges[2].metric.getValue()).to.equal(4433);
        expect(gauges[3].metric.getValue()).to.equal(5);
        expect(gauges[4].metric.getValue()).to.equal(11);
        expect(gauges[5].metric.getValue()).to.equal(957905);
        expect(gauges[6].metric.getValue()).to.equal(1027699);
        expect(gauges[7].metric.getValue()).to.equal(8704);
        expect(gauges[8].metric.getValue()).to.equal(0);
        expect(gauges[9].metric.getValue()).to.equal(5349);
    });
});
