import {expect} from 'chai';
import {ErrorEndPoint, ErrorIndicator, MetricsConstants, LoggerMessageCollector} from '../../../src';

describe('/test/unit/endpoint/ErrorEndPoint.test.ts', () => {

  let endpoint = new ErrorEndPoint();
  endpoint.initialize();

  let loggerCollector = new LoggerMessageCollector();
  let indicator = new ErrorIndicator(loggerCollector);
  indicator.initialize();

  it('invoke empty Error endpoint', async () => {
    expect(endpoint.indicators.length).to.equal(1);
    let results = await endpoint.invoke({
      appName: MetricsConstants.METRICS_DEFAULT_APP
    });
    expect(results.length).to.equal(0);
  });

  it('invoke Error endpoint with error', (done) => {

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

    setTimeout(async () => {
      let results = await endpoint.invoke({
        appName: MetricsConstants.METRICS_DEFAULT_APP
      });
      expect(results.length).to.equal(1);
      done();
    }, 1500);
  });

});
