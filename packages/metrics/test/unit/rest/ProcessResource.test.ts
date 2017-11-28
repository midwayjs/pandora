import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {ProcessIndicator} from '../../../src/indicator/impl/ProcessIndicator';
import {ProcessResource} from '../../../src/rest/ProcessResource';
import {ProcessEndPoint} from '../../../src/endpoint/impl/ProcessEndPoint';

describe.only('/test/unit/ProcessResource.test.ts', () => {

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
      endPoints: {
        error: {
          enabled: true,
          target: ProcessEndPoint,
          resource: ProcessResource
        }
      }
    });

    request(app.listen())
      .get('/process')
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
