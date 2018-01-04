/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as sinon from 'sinon';
import { expect } from 'chai';
import { TraceEndPoint, SKIP_RATE } from '../../../src/';

describe('/test/unit/endpoint/TraceEndpoint.test.ts', () => {
  let endpoint;

  before(function() {
    endpoint = new TraceEndPoint();
    endpoint.initialize();
  });

  it('should collect normal trace by rate', async () => {
    const stub = sinon.stub(endpoint, 'getRate').returns(100);

    endpoint.processReporter({
      appName: 'test-app',
      traceId: '123456789',
      status: 1
    });

    stub.restore();

    const data = await endpoint.invoke({
      traceId: '123456789'
    });

    expect(data.length).to.equal(1);
  });

  it('should collect error or slow trace skip rate', async () => {
    const stub = sinon.stub(endpoint, 'getRate').returns(-1);

    endpoint.processReporter({
      appName: 'test-app',
      traceId: '1234567890',
      status: 2
    });

    stub.restore();

    const data = await endpoint.invoke({
      traceId: '1234567890'
    });

    expect(data.length).to.equal(1);
    expect(data[0][SKIP_RATE]).to.be.true;
  });

});
