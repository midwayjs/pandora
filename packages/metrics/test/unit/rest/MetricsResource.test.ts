import actuatorConfig from '../../../src/conf/default';
import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';
import {MetricsEndPoint} from '../../../src/endpoint/impl/MetricsEndPoint';
import {expect} from 'chai';
import {BaseGauge, MetricName, MetricSet} from '../../../src/common/index';
import {V8GaugeSet} from '../../../src/metrics/node/V8GaugeSet';
import {MetricsClient} from '../../../src/MetricsClient';
import {MetricsInjectionBridge} from '../../../src/util/MetricsInjectionBridge';

const request = require('supertest');

describe('/test/unit/MetricsResource.test.ts', () => {

  let app;

  before(() => {
    actuatorConfig['http']['enabled'] = false;
    let manager = MetricsInjectionBridge.getMetricsManager();

    let endPointService = new EndPointService();
    endPointService.setEndPointIns([
      new MetricsEndPoint()
    ]);

    endPointService.start();

    let restService = new ActuatorRestService(endPointService);
    app = restService.start(actuatorConfig);

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

    manager.register('system', MetricName.build('test.a.b').tagged({
      appName: 'app1'
    }), new TestMetricSet());
    client.register('system', MetricName.build('node.v8').tagged({
      appName: 'app2'
    }), new V8GaugeSet());
  });

  it('list metrics resource', (done) => {
    request(app.listen())
      .get('/metrics/list')
      .expect(200)
      .then(res => {
        expect(res.body.success).to.true;
        expect(res.body.data['system']).to.exist;
        done();
      })
      .catch(err => {
        console.error(err);
      });
  });

  it('list metrics resource by appName', (done) => {
    request(app.listen())
      .get('/metrics/list')
      .query({
        appName: 'app1'
      })
      .expect(200)
      .then(res => {
        expect(res.body.success).to.true;
        let find = false;
        for (let metric of res.body.data['system']) {
          if (metric.tags.appName === 'app2') {
            find = true;
          }
        }
        expect(find).to.be.false;
        done();
      })
      .catch(err => {
        console.error(err);
      });
  });

  it('list metrics resource by appName and group', (done) => {
    request(app.listen())
      .get('/metrics/list/system')
      .query({
        appName: 'app1'
      })
      .expect(200)
      .then(res => {
        expect(res.body.success).to.true;
        let find = false;
        for (let metric of res.body.data['system']) {
          if (metric.tags.appName === 'app2') {
            find = true;
          }
        }
        expect(find).to.be.false;
        done();
      })
      .catch(err => {
        console.error(err);
      });
  });


  it('show metric value', (done) => {
    request(app.listen())
      .get('/metrics/system')
      .expect(200)
      .then(res => {
        expect(res.body.success > 0).to.true;
        expect(res.body.data[0].metric).to.equal('test.a.b.c.gauge');
        done();
      });
  });

  it('show metric by appName', (done) => {
    request(app.listen())
      .get('/metrics/system')
      .query({
        appName: 'app1'
      })
      .expect(200)
      .then(res => {
        expect(res.body.success > 0).to.true;
        expect(res.body.data[0].metric).to.equal('test.a.b.c.gauge');
        let find = false;
        for (let metric of res.body.data) {
          if (metric.tags.appName === 'app2') {
            find = true;
          }
        }
        expect(find).to.be.false;
        done();
      });
  });


});
