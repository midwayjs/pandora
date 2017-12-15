import {ActuatorRestService} from '../../../src/service/ActuatorRestService';
import {EndPointService} from '../../../src/service/EndPointService';

const request = require('supertest');
import {expect} from 'chai';
import {MessageConstants, TraceEndPoint, TraceManager, TraceResource} from '../../../src';
import {MessageSender} from '../../../src/util/MessageSender';

describe.only('/test/unit/TraceResource.test.ts', () => {

  let endPointService = new EndPointService();
  endPointService.setEndPointIns([
    new TraceEndPoint()
  ]);

  endPointService.start();

  it('query error http api from error resource', (done) => {

    const manager = new TraceManager();
    manager.run(() => {
      let tracer = manager.create();

      let span = tracer.startSpan('http');

      span.setTag('url', '/test');
      span.finish();
      tracer.finish();

      const sender = new MessageSender();
      sender.send(MessageConstants.TRACE, tracer.report());

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

      request(app.listen())
        .get('/trace')
        .query({
          appName: 'DEFAULT_APP'
        })
        .expect(200)
        .then(res => {
          console.log(res.body);
          expect(res.body.data.length >= 0).to.be.true;
          expect(res.body.success).to.true;
          done();
        })
        .catch(err => {
          done(err);
        });
    });

  });

});
