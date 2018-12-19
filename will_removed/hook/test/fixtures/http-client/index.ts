import { RunUtil } from '../../RunUtil';
import { HEADER_SPAN_ID, HEADER_TRACE_ID } from '../../../src/utils/Constants';
import * as assert from 'assert';
// 放在前面，把 http.ClientRequest 先复写
const nock = require('nock');
import { HttpServerPatcher } from '../../../src/patch/HttpServer';
import { HttpClientPatcher } from '../../../src/patch/HttpClient';
const httpServerPatcher = new HttpServerPatcher();
const httpClientPatcher = new HttpClientPatcher({
  // nock 复写了 https.request 方法，没有像原始一样调用 http.request，所以需要强制复写
  forceHttps: true
});

RunUtil.run(function(done) {
  httpServerPatcher.run();
  httpClientPatcher.run();

  const http = require('http');
  const https = require('https');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    const spans = report.spans;
    assert(spans.length === 4);
    const first = spans[0];
    const second = spans[1];
    const third = spans[2];
    const last = spans[3];

    assert(report.traceId === '1234567890');
    assert(second.context.parentId === first.context.spanId);
    assert(third.context.parentId === second.context.spanId);
    assert(last.context.parentId === second.context.spanId);
    assert(third.tags.error.value === false);
    assert(third.tags['http.status_code'].value === 302);
    assert(last.tags.error.value);
    assert(last.tags['http.status_code'].value === -1);
    done();
  });

  nock('https://www.taobao.com')
    .get('/')
    .reply(200);

  nock('https://www.taobao.com')
    .get(/\/\d{13}/)
    .reply(302);

  function request(agent, options) {

    return new Promise((resolve, reject) => {
      const req = agent.request(options, (res) => {
        let data = '';

        res.on('data', (d) => {
          data += d;
        });

        res.on('end', () => {
          resolve([res, data]);
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  const server = http.createServer((req, res) => {
    request(https, {
      hostname: 'www.taobao.com',
      path: '/',
      method: 'GET'
    }).then((response) => {
      assert(response[0].req.headers[HEADER_TRACE_ID] === '1234567890');
      assert(!!response[0].req.headers[HEADER_SPAN_ID]);

      return Promise.all([
        request(https, {
          hostname: 'www.taobao.com',
          path: `/${Date.now()}`,
          method: 'GET'
        }),
        request(http, {
          hostname: `www.${Date.now()}notfound.com`,
          path: '/',
          method: 'GET'
        }).catch((err) => {
          res.end('hello');
        })
      ]);
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      request(http, {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        headers: {
          'X-Trace-Id': '1234567890'
        }
      }).catch((err) => {
        console.log('err: ', err);
      });
    }, 500);
  });
});

