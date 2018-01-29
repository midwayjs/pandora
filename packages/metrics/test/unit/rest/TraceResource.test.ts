import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {MessageConstants, TraceEndPoint, TraceIndicator, TraceManager, TraceResource} from '../../../src';
import {MessageSender} from '../../../src/util/MessageSender';

describe('/test/unit/TraceResource.test.ts', () => {

  let endPointService = new EndPointService();
  let endpoint = new TraceEndPoint();
  endpoint.setConfig({
    initConfig: {
      rate: 100
    }
  });
  endPointService.setEndPointIns([
    endpoint
  ]);

  endPointService.start();

  it('query error http api from error resource', (done) => {

    const sender = new MessageSender();

    let restService = new ActuatorRestService(endPointService);
    let app = restService.start({
      http: {
        enabled: false,
        port: 8006,
      },
      endPoint: {
        error: {
          enabled: true,
          target: TraceEndPoint,
          resource: TraceResource
        }
      }
    });

    const manager = new TraceManager();
    let traceIndicator = new TraceIndicator(undefined, manager);
    traceIndicator.initialize();

    manager.run(() => {
      let tracer = manager.create();
      let span = tracer.startSpan('http');

      span.setTag('url', '/test');
      span.finish();
      tracer.finish();
      sender.send(MessageConstants.TRACE, tracer.report());
    });

    request(app.listen())
      .get('/trace')
      .query({
        appName: 'DEFAULT_APP'
      })
      .expect(200)
      .then(res => {
        expect(res.body.data.items.length >= 0).to.be.true;
        expect(res.body.success).to.true;
        done();
      })
      .catch(err => {
        done(err);
      });

  });

});
