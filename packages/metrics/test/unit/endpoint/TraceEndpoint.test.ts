import { expect } from 'chai';
import { TraceEndPoint, SKIP_RATE } from '../../../src/';

describe('/test/unit/endpoint/TraceEndpoint.test.ts', () => {
  let endpoint;

  before(function() {
    endpoint = new TraceEndPoint();
    endpoint.setConfig({
      priority: true
    });
    endpoint.initialize();
  });

  it('should collect normal trace by rate', async () => {
    endpoint.setConfig({
      rate: 100,
      priority: true
    });

    endpoint.processReporter({
      appName: 'test-app',
      traceId: '123456789',
      status: 1
    });

    const data = await endpoint.invoke({
      traceId: '123456789'
    });

    expect(data.length).to.equal(1);
  });

  it('should collect error or slow trace skip rate when priority is true', async () => {
    endpoint.setConfig({
      rate: -1,
      priority: true
    });

    endpoint.processReporter({
      appName: 'test-app',
      traceId: '1234567890',
      status: 2
    });

    const data = await endpoint.invoke({
      traceId: '1234567890'
    });

    expect(data.length).to.equal(1);
    expect(data[0][SKIP_RATE]).to.be.true;
  });

  it('should not collect error or slow trace was ignored by rate when priority is false', async () => {
    endpoint.setConfig({
      rate: -1,
      priority: false
    });

    endpoint.processReporter({
      appName: 'test-app',
      traceId: '12345678900',
      status: 2
    });

    const data = await endpoint.invoke({
      traceId: '12345678900'
    });

    expect(data.length).to.equal(0);
  });

});
