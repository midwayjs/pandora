// 放在前面，把 http.ClientRequest 先复写
import * as nock from 'nock';
import { Fixture, sleep, request } from '../../TestUtil';
import { HttpServerPatcher, HttpClientPatcher } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { HEADER_TRACE_ID, HEADER_SPAN_ID } from 'pandora-tracer';
import { consoleLogger } from 'pandora-dollar';

export default class HttpClientFixture extends Fixture {

  config() {

    return {
      patchers: {
        httpServer: {
          enabled: true,
          klass: HttpServerPatcher
        },
        httpClient: {
          enabled: true,
          klass: HttpClientPatcher,
          tracing: true
        }
      }
    };
  }

  async case(done) {
    const http = require('http');

    nock('http://www.taobao.com')
      .get('/')
      .reply(200);

    const httpClientPatcher = this.autoPatching.instances.get('httpClient');
    const stub = sinon.stub(httpClientPatcher.tracer, 'inject').throws('inject error');
    const spy = sinon.spy(consoleLogger, 'info');

    const server = http.createServer(function(req, res) {
      setTimeout(() => {
        request(http, {
          hostname: 'www.taobao.com',
          path: '/',
          method: 'GET'
        }).then((response) => {
          const headers = response[0].req.headers;
          assert(!headers[HEADER_TRACE_ID]);
          assert(!headers[HEADER_SPAN_ID]);
          assert(spy.calledWith(sinon.match('[HttpClientPatcher] inject tracing context to headers error.')));
          stub.restore();
          spy.restore();
          done();
          res.end('OK');
        });
      },  Math.floor(1 + Math.random() * 10) * 100);
    });

    server.listen(0);

    sleep(1000);

    const port = server.address().port;

    await request(http, {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      headers: {
        'X-Trace-Id': '1234567890'
      }
    });
  }
}