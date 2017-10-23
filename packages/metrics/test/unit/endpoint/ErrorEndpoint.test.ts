import {expect} from 'chai';
import {ErrorEndPoint} from '../../../src/endpoint/impl/ErrorEndPoint';
import EventEmitter = require('events');
import {ErrorIndicator} from '../../../src/indicator/impl/ErrorIndicator';
import {MetricsConstants} from '../../../src/MetricsConstants';

class LoggerManager extends EventEmitter {
}


describe('/test/unit/endpoint/ErrorEndPoint.test.ts', () => {

  let endpoint = new ErrorEndPoint();
  endpoint.initialize();

  let loggerManager = new LoggerManager();
  let indicator = new ErrorIndicator(loggerManager);
  indicator.initialize();

  after(() => {
    //endpoint.destory();
    //indicator.destory();
  });

  it('invoke empty Error endpoint', async () => {
    expect(endpoint.indicators.length).to.be.equal(1);
    let results = await endpoint.invoke(MetricsConstants.METRICS_DEFAULT_APP);
    expect(results.length).to.be.equal(0);
  });

  it('invoke Error endpoint with error', (done) => {

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

    setTimeout(async () => {
      let results = await endpoint.invoke(MetricsConstants.METRICS_DEFAULT_APP);
      expect(results.length).to.be.equal(1);
      done();
    }, 1500);
  });

});
