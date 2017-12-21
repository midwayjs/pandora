import {DiskSpaceHealthIndicator} from '../../../src/indicator/impl/health/DiskSpaceHealthIndicator';
import {expect} from 'chai';
import {HealthEndPoint, MetricsConstants, PortHealthIndicator} from '../../../src';

describe('/test/unit/endpoint/HealthEndpoint.test.ts', () => {

  it('invoke health endpoint', async () => {
    let endpoint = new HealthEndPoint();
    endpoint.setConfig({
      enabled: true,
      target: HealthEndPoint,
      initConfig: {
        port: {
          enabled: true,
          checkUrl: `http://127.1:6001/check.node`
        },
        disk_space: {
          enabled: true,
          rate: 80,
        }
      }
    });
    endpoint.initialize();

    let healthIndicator = new DiskSpaceHealthIndicator();
    healthIndicator.initialize();
    let portHealthIndicator = new PortHealthIndicator();
    portHealthIndicator.initialize();


    let results = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(endpoint.invoke());
      }, 200);
    });
    expect(results[MetricsConstants.METRICS_DEFAULT_APP][0].key).to.be.equal('disk_space');
    expect(results[MetricsConstants.METRICS_DEFAULT_APP][1].key).to.be.equal('port');
  });

});
