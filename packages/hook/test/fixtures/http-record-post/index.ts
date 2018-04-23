/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
import { HttpServerPatcher } from '../../../src/patch/HttpServer';

const httpServerPatcher = new HttpServerPatcher({
  recordPostData: true
});

RunUtil.run(function(done) {
  httpServerPatcher.run();
  const http = require('http');
  const urllib = require('urllib');

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report.name === 'HTTP-POST:/');
    assert(report.spans.length === 1);
    const logs = report.spans[0].logs;
    const fields = logs[0].fields;
    assert(fields[0].key === 'data');
    assert(JSON.stringify(fields[0].value) === '{"age":"100"}');

    done();
  });

  const server = http.createServer((req, res) => {

    res.end('hello');
  });

  server.listen(0, () => {
    const port = server.address().port;

    urllib.request(`http://localhost:${port}/?name=test`, {
      method: 'post',
      data: {
        age: 100
      }
    });
  });
});
