import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {InfoEndPoint} from '../../../src/endpoint/impl/InfoEndPoint';
import {BaseInfoIndicator} from '../../../src/indicator/impl/BaseInfoIndicator';
import {InfoResource} from '../../../src/rest/InfoResource';

describe('/test/unit/InfoResource.test.ts', () => {

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new InfoEndPoint()
  ]);

  endPointService.start();

  it('query error http api from error resource', (done) => {

    let indicator = new BaseInfoIndicator();
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
          target: InfoEndPoint,
          resource: InfoResource
        }
      }
    });

    request(app.listen())
      .get('/info')
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
