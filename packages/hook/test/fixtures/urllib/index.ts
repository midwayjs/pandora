'use strict';
import { RunUtil } from '../../RunUtil';
const assert = require('assert');
const { HttpPatcher } = require('../../../src/patch/http');
const { UrllibPatcher } = require('../../../src/patch/urllib');
const httpPatcher = new HttpPatcher();
const urllibPatcher = new UrllibPatcher();

RunUtil.run(function(done) {
  httpPatcher.run();
  urllibPatcher.run();

  const http = require('http');
  const urllib = require('urllib');

  process.on('PANDORA_PROCESS_MESSAGE_TRACE', report => {
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

  const server = http.createServer((req, res) => {
    urllib.request('https://www.taobao.com/tbhome/page/about/home').then(() => {

      return Promise.all([
        urllib.request(`https://www.taobao.com/tbhome/page/about/home/${Date.now()}`),
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
