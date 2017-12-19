import actuatorConfig from '../../../src/conf/default';
import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {HealthEndPoint, HealthIndicator} from '../../../src';

describe.only('/test/unit/HealthResource.test.ts', () => {

  actuatorConfig['http']['enabled'] = false;

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new HealthEndPoint()
  ]);

  endPointService.start();

  class MyHealthIndicator extends HealthIndicator {

    doCheck(builder: any, initConfig?: any) {
      builder.up();
    }

  }

  let app;

  it('test heath router', (done) => {

    let healthIndicator = new MyHealthIndicator();
    healthIndicator.initialize();

    let restService = new ActuatorRestService(endPointService);
    console.log(actuatorConfig);
    app = restService.start(actuatorConfig);

    request(app.listen())
      .get('/health')
      .query({
        appName: 'DEFAULT_APP'
      })
      .expect(200)
      .then(res => {
        console.log(res.body);
        expect(res.body.data['MyHealthIndicator']['status']).to.equal('UP');
        expect(res.body.success).to.true;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('test heath router without appName', (done) => {
    request(app.listen())
      .get('/health')
      .expect(200)
      .then(res => {
        expect(res.body.data['DEFAULT_APP']['MyHealthIndicator']['status']).to.equal('UP');
        expect(res.body.success).to.true;
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});
