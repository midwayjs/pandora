'use strict';
import { RunUtil } from '../../RunUtil';
// 放在前面，把 http.ClientRequest 先复写
const nock = require('nock');
const assert = require('assert');
const { HttpServerPatcher } = require('../../../src/patch/HttpServer');
const { HttpClientPatcher } = require('../../../src/patch/HttpClient');
const httpServerPatcher = new HttpServerPatcher();
const httpClientPatcher = new HttpClientPatcher({
  // nock 复写了 https.request 方法，没有像原始一样调用 http.request，所以需要强制复写
  forceHttps: true
});

RunUtil.run(function(done) {
  httpServerPatcher.run();
  httpClientPatcher.run();

  const http = require('http');
  const urllib = require('urllib');

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    const spans = report.spans;
    assert(spans.length === 4);
    const first = spans[0];
    const second = spans[1];
    const third = spans[2];
    const last = spans[3];

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

  const server = http.createServer((req, res) => {
    urllib.request('https://www.taobao.com/').then(() => {

      return Promise.all([
        urllib.request(`https://www.taobao.com/${Date.now()}`),
        urllib.request(`http://www.${Date.now()}notfound.com/`).catch((err) => {})
      ]).then(() => {
        res.end('hello');
      });
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      urllib.request(`http://localhost:${port}/?test=query`);
    }, 500);
  });
});
