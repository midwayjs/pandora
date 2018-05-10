import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
import { HttpServerPatcher } from '../../../src/';

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
    // assert(JSON.stringify(fields[0].value) === '{"age":"100"}');
    assert.deepEqual(fields[0].value, {age: 100});

    done();
  });

  const server = http.createServer((req, res) => {

    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      res.end('hello');
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    urllib.request(`http://localhost:${port}/?name=test`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      data: {
        age: 100
      }
    });
  });
});
