import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {MetricsConstants, ProcessEndPoint, ProcessIndicator, ProcessResource} from '../../../src';

describe('/test/unit/ProcessResource.test.ts', () => {

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new ProcessEndPoint()
  ]);

  endPointService.start();

  it('query error http api from error resource', (done) => {

    let indicator = new ProcessIndicator();
    indicator.initialize();

    let restService = new ActuatorRestService(endPointService);
    let app = restService.start({
      http: {
        enabled: false,
        port: 8006,
      },
      endPoint: {
        error: {
          enabled: true,
          target: ProcessEndPoint,
          resource: ProcessResource
        }
      }
    });

    request(app.listen())
      .get('/process')
      .query({
        appName: MetricsConstants.METRICS_DEFAULT_APP
      })
      .expect(200)
      .then(res => {
        expect(res.body.data.length >= 0).to.be.true;
        expect(res.body.success).to.true;
        done();
      })
      .catch(err => {
        done(err);
      });

  });

});
