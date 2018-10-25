import { expect } from 'chai';
import {
  BaseCounter,
  BaseFastCompass,
  BaseGauge,
  BaseHistogram,
  BaseMeter,
  BaseTimer,
  MetricName
} from '../../../src/common';
import { FileMetricsManagerReporter, MetricsServerManager } from '../../../src';
import { join } from 'path';

const fs = require('fs');
const os = require('os');

describe('/test/unit/reporter/FileMetricManagerReporter.test.ts', () => {

  const metricsPath = join(os.tmpdir(), 'pandorajs/metrics.log');

  before(() => {
    if (fs.existsSync(metricsPath)) {
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
    manager.register('test', MetricName.build('reporter.register.fastCompass'), new BaseFastCompass());
    const reporter = new FileMetricsManagerReporter(null, {});
    reporter.setMetricsManager(manager);
    reporter.start(0.4);

    setTimeout(() => {
      expect(fs.existsSync(metricsPath)).to.true;
      done();
    }, 1000);
  });
});
