import {expect} from 'chai';
import {BaseCounter, MetricName, BaseHistogram, BaseTimer, BaseMeter, BaseGauge} from '../../../src/common/index';
import {MetricsServerManager} from '../../../src/MetricsServerManager';
import {FileMetricManagerReporter} from '../../../src/reporter/FileMetricManagerReporter';
const fs = require('fs');
const os = require('os');

describe('/test/unit/reporter/FileMetricManagerReporter.test.ts', () => {

  const metricsPath = os.homedir() + '/logs/pandorajs/metrics.log';

  before(() => {
    if(fs.existsSync(metricsPath)) {
      fs.unlinkSync(metricsPath);
    }
  });

  it('register a metric and report to file reporter invoke test', (done) => {
    expect(fs.existsSync(metricsPath)).to.false;

    const manager = new MetricsServerManager();
    manager.register('test', MetricName.build('reporter.register.pv'), new BaseCounter());
    manager.register('test', MetricName.build('reporter.register.qps'), new BaseCounter());
    manager.register('test', MetricName.build('reporter.register.gauge'), <BaseGauge<number>>{
      getValue() {
        return 0;
      }
    });
    manager.register('test', MetricName.build('reporter.register.histogram'), new BaseHistogram());
    manager.register('test', MetricName.build('reporter.register.timer'), new BaseTimer());
    manager.register('test', MetricName.build('reporter.register.meter'), new BaseMeter());
    const reporter = new FileMetricManagerReporter(null , {});
    reporter.setMetricManager(manager);
    reporter.start(0.4);

    setTimeout(() => {
      expect(fs.existsSync(metricsPath)).to.true;
      done();
    }, 1000);
  });
});
