import {BaseCounter, MetricName, BaseHistogram, BaseTimer, BaseMeter, BaseGauge} from '../../../src/common/index';
import {MetricsServerManager} from '../../../src/MetricsServerManager';
import {ConsoleReporter} from '../../../src/reporter/ConsoleReporter';

describe('/test/unit/reporter/ConsoleReporter.test.ts', () => {

  it('register a metric and report to file reporter invoke test', (done) => {
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
    const reporter = new ConsoleReporter();
    reporter.setMetricManager(manager);
    reporter.start(0.4);

    setTimeout(() => {
      reporter.stop();
      done();
    }, 600);
  });
});
