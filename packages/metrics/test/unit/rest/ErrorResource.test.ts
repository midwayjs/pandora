import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {ErrorIndicator} from '../../../src/indicator/impl/ErrorIndicator';
import {ErrorResource} from '../../../src/rest/ErrorResource';
import {LoggerMessageCollector} from '../../../src/util/MessageCollector';
import {ErrorEndPoint} from '../../../src';

describe('/test/unit/ErrorResource.test.ts', () => {

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new ErrorEndPoint()
  ]);

  endPointService.start();
  let loggerCollector = new LoggerMessageCollector();

  it('query error http api from error resource', (done) => {

    let indicator = new ErrorIndicator(loggerCollector);
    indicator.initialize();

    loggerCollector.report({
      method: 'error',
      from: 'worker',
      errType: 'Error',
      message: 'something error',
      stack: ''
    });

    loggerCollector.report({
      method: 'info',
      from: 'worker',
      errType: 'Error',
      message: 'something error',
      stack: ''
    });

    let restService = new ActuatorRestService(endPointService);
    let app = restService.start({
      http: {
        enabled: false,
        port: 8006,
      },
      endPoint: {
        error: {
          enabled: true,
          target: ErrorEndPoint,
          resource: ErrorResource
        }
      }
    });

    request(app.listen())
      .get('/error')
      .expect(200)
      .then(res => {
        expect(res.body.data.count >= 0).to.be.true;
        expect(res.body.success).to.true;
        done();
      })
      .catch(err => {
        done(err);
      });

  });

});
