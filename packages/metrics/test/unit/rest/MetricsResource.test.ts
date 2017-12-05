import actuatorConfig from '../../../src/conf/default';
import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';
import {MetricsEndPoint} from '../../../src/endpoint/impl/MetricsEndPoint';

const request = require('supertest');
import {expect} from 'chai';
import {MetricsServerManager} from '../../../src/MetricsServerManager';
import {MetricSet, MetricName, BaseGauge} from '../../../src/common/index';
import {V8GaugeSet} from '../../../src/metrics/node/V8GaugeSet';
import {MetricsClient} from '../../../src/MetricsClient';

describe('/test/unit/MetricsResource.test.ts', () => {

  actuatorConfig['http']['enabled'] = false;

  const manager = MetricsServerManager.getInstance();

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new MetricsEndPoint()
  ]);

  endPointService.start();

  let restService = new ActuatorRestService(endPointService);
  let app = restService.start(actuatorConfig);

  it('list metrics resource', (done) => {
    request(app.listen())
      .get('/metrics/list')
      .expect(200)
      .then(res => {
        expect(res.body.success).to.true;
        done();
      });
  });

  it('list one metric', (done) => {

    class TestMetricSet extends MetricSet {

      getMetrics() {
        return [
          {
            name: MetricName.build('c.gauge'),
            metric: <BaseGauge<number>>{
              getValue() {
                return 10;
              }
            }
          }
        ];
      }

    }

    const client = new MetricsClient();

    manager.register('system', MetricName.build('test.a.b'), new TestMetricSet());
    client.register('system', MetricName.build('node.v8'), new V8GaugeSet());

    request(app.listen())
      .get('/metrics/system')
      .expect(200)
      .then(res => {
        expect(res.body.success > 0).to.true;
        expect(res.body.data[0].metric).to.be.equal('test.a.b.c.gauge');
        done();
      });
  });
});
