// 放在前面，把 http.ClientRequest 先复写
import * as nock from 'nock';
import { gzipSync } from 'zlib';
import { Fixture, sleep, request } from '../../TestUtil';
import { HttpServerPatcher, HttpClientPatcher, HttpClientWrapper } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import * as pedding from 'pedding';
import { SPAN_FINISHED } from 'pandora-component-trace';
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
          kWrapper: HttpClientWrapper,
          recordResponse: true,
          maxResponseSize: 20
        }
      }
    };
  }

  async case(done) {
    const http = require('http');
    const _done = pedding(done, 2);

    nock('http://www.taobao.com')
      .get('/')
      .reply(200, gzipSync(Buffer.from('Response from TaoBao.')), {
        'Content-Encoding': 'gzip'
      });

    const stub = sinon.stub(this.componentTrace.traceManager, 'record').callsFake(function(span, isEntry) {
      const context = span.context();
      assert(context.traceId === '1234567890');

      span.once(SPAN_FINISHED, (s) => {
        assert(s.duration > 0);

        if (!isEntry) {
          assert(span.tag('http.response_size') === 41);
        }
        _done();
      });
    });

    const spy = sinon.spy(consoleLogger, 'info');

    const server = http.createServer(function(req, res) {
      setTimeout(() => {
        request(http, {
          hostname: 'www.taobao.com',
          path: '/',
          method: 'GET'
        }).then(() => {
          assert(spy.calledWith(sinon.match('[HttpClientWrapper] response size greater than maxResponseSize, ignore chunk.')));

          spy.restore();
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

    stub.restore();
  }
}