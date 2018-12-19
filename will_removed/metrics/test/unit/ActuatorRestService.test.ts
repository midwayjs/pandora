import {ActuatorRestService} from '../../src/service/ActuatorRestService';
import {EndPointService} from '../../src/service/EndPointService';
import {expect} from 'chai';
import {ActuatorResource, EndPoint, MetricsConstants} from '../../src';

const request = require('supertest');

class MockEndPoint extends EndPoint {
  group = 'mock';
}

class MockResource implements ActuatorResource {

  prefix: string = '/mock';

  aliasPrefix = ['/easymock'];

  route(router) {
    router.get('/method1', (ctx, next) => {
      ctx.ok({
        result: 1
      });
    });

    router.get('/method2', (ctx, next) => {
      ctx.fail('error');
    });

    router.get('/method3', (ctx, next) => {
      ctx.ok('method3');
    });
  }
}

describe('/test/unit/ActuatorRestService.test.ts', () => {

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new MockEndPoint()
  ]);

  endPointService.start();
  let app;

  before(() => {
    let restService = new ActuatorRestService(endPointService);
    app = restService.start({
      http: {
        enabled: false,
        port: 8006,
      },
      endPoint: {
        mock: {
          enabled: true,
          target: MockEndPoint,
          resource: MockResource
        }
      }
    });
  });

  it('query data from resource successful', (done) => {
    request(app.listen())
      .get('/mock/method1')
      .query({
        appName: MetricsConstants.METRICS_DEFAULT_APP
      })
      .expect(200)
      .then(res => {
        expect(res.body.success).to.be.true;
        expect(res.body.data.result).to.equal(1);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('query data from resource failure', (done) => {
    request(app.listen())
      .get('/mock/method2')
      .query({
        appName: MetricsConstants.METRICS_DEFAULT_APP
      })
      .expect(200)
      .then(res => {
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal('error');
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('query data from resource with alias prefix', (done) => {
    request(app.listen())
      .get('/easymock/method1')
      .query({
        appName: MetricsConstants.METRICS_DEFAULT_APP
      })
      .expect(200)
      .then(res => {
        expect(res.body.result).to.equal(1);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('query data from resource with alias prefix and test koa text response', (done) => {
    request(app.listen())
      .get('/easymock/method3')
      .query({
        appName: MetricsConstants.METRICS_DEFAULT_APP
      })
      .expect(200)
      .then(res => {
        expect(res.text).to.equal('method3');
        done();
      })
      .catch(err => {
        done(err);
      });
  });

});
