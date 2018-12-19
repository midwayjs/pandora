import {expect} from 'chai';
import {MetricsEndPoint} from '../../../src/endpoint/impl/MetricsEndPoint';
import {MetricName, BaseCounter, BaseGauge} from '../../../src/common/index';
import {MetricsInjectionBridge} from '../../../src/util/MetricsInjectionBridge';

describe('/test/unit/endpoint/MetricsEndPoint.test.ts', () => {

  let server = MetricsInjectionBridge.getMetricsManager();
  let endpoint;

  before(() => {
    endpoint = new MetricsEndPoint();
    endpoint.initialize();

    server.register('test1', MetricName.build('reporter.register.pv'), new BaseCounter());
    server.register('test2', MetricName.build('reporter.register.mem'), <BaseGauge<any>>{
      getValue() {
        return 0;
      }
    });
    server.register('test2', MetricName.build('reporter.register.qps'), <BaseGauge<any>>{
      getValue() {
        return 5;
      }
    });

  });

  it('invoke empty metrics endpoint', async () => {
    const metricResults = await endpoint.listMetrics();
    // key is group
    expect(Object.keys(metricResults).length >= 2).to.be.true;
  });

});
