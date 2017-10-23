import actuatorConfig from '../../../src/conf/default';
import {expect} from 'chai';
import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';
import {InfoEndPoint} from '../../../src/endpoint/impl/InfoEndPoint';
const request = require('supertest');

describe('/test/unit/ActuatorService.test.ts', () => {

  actuatorConfig['http']['enabled'] = false;

  it('init empty endpoint service', () => {
    expect(() => {
      let endPointService = new EndPointService();
      endPointService.start();
    }).to.not.throw;
  });

  it('init actuator service', (done) => {

    let endPointService = new EndPointService();
    endPointService.setEndPointIns([
      new InfoEndPoint()
    ]);

    endPointService.start();

    let restService = new ActuatorRestService(endPointService);
    let app = restService.start(actuatorConfig);

    request(app.listen())
      .get('/')
      .expect(200)
      .end(done);
  });
});
