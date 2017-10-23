import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';
const request = require('supertest');
import {expect} from 'chai';
import {ErrorEndPoint} from '../../../src/endpoint/impl/ErrorEndPoint';
import {ErrorIndicator} from '../../../src/indicator/impl/ErrorIndicator';
import EventEmitter = require('events');
import {ErrorResource} from '../../../src/rest/ErrorResource';

class LoggerManager extends EventEmitter {
}

describe('/test/unit/ErrorResource.test.ts', () => {

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new ErrorEndPoint()
  ]);

  endPointService.start();
  let loggerManager = new LoggerManager();

  it('query error http api from error resource', (done) => {

    let indicator = new ErrorIndicator(loggerManager);
    indicator.initialize();

    loggerManager.emit('message', {
      method: 'error',
      from: 'worker',
      errType: 'Error',
      message: 'something error',
      stack: ''
    });

    loggerManager.emit('message', {
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
      endPoints: {
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
        expect(res.body.data.length >= 0).to.be.true;
        expect(res.body.success).to.true;
        done();
      })
      .catch(err => {
        done(err);
      });

  });

});
