import {expect} from 'chai';
import {MetricsEndPoint} from '../../../src/endpoint/impl/MetricsEndPoint';
import {MetricsServerManager} from '../../../src/MetricsServerManager';
import {MetricName, BaseCounter} from '../../../src/common/index';
import {MetricsInjectionBridge} from '../../../src/util/MetricsInjectionBridge';

describe('/test/unit/endpoint/MetricsEndPoint.test.ts', () => {

  let server = MetricsServerManager.getInstance();
  MetricsInjectionBridge.setMetricsManager(server);

  let endpoint = new MetricsEndPoint();
  endpoint.initialize();

  server.register('test1', MetricName.build('reporter.register.pv'), new BaseCounter());
  server.register('test2', MetricName.build('reporter.register.mem'), {
    getValue() {
      return 0;
    }
  });
  server.register('test2', MetricName.build('reporter.register.qps'), {
    getValue() {
      return 5;
    }
  });

  it('invoke empty metrics endpoint', async () => {
    const metricResults = endpoint.listMetrics();
    // key is group
    expect(Object.keys(metricResults).length).to.be.equal(2);
  });

});
