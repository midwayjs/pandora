import {expect} from 'chai';
import {ScheduledMetricsReporter} from '../../../src/reporter/ScheduledMetricsReporter';
import {BaseCounter, MetricName} from '../../../src/common/index';
import {MetricsServerManager} from '../../../src/MetricsServerManager';
const debug = require('debug')('pandora:metrics:reporterTest');


describe('/test/unit/reporter/reporter.test.ts', () => {

  it('register a metric and report invoke test', (done) => {
    class MyReporter extends ScheduledMetricsReporter {

      report(metricsData) {
        let {counters} = metricsData;
        debug('call custom report once');
        expect(counters.size).to.be.equal(1);
        expect(Array.from(counters.keys()).length).to.be.equal(1);
        reporter.stop();
        done();
      }
    }

    const manager = new MetricsServerManager();
    manager.register('test', MetricName.build('reporter.register.pv'), new BaseCounter());
    const reporter = new MyReporter();
    reporter.setMetricsManager(manager);
    reporter.start(1);
  });
});
