import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
import { HttpServerPatcher } from '../../../src/patch/HttpServer';

const httpServerPatcher = new HttpServerPatcher({
  recordPostData: true,
  bufferTransformer: function(buffer, req) {
    const type = req.headers['content-type'];
    let data = buffer.toString('utf8');

    if (type === 'application/x-www-form-urlencoded') {
      data = `~${data}~`;
    }

    return data;
  },
  recordUrl: true
});

RunUtil.run(function(done) {
  httpServerPatcher.run();
  const http = require('http');
  const urllib = require('urllib');

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report.name === 'HTTP-POST:/');
    assert(report.spans.length === 1);
    const logs = report.spans[0].logs;
    const urlLog = logs[0];
    const paramsLog = logs[1];
    const urlFields = urlLog.fields;
    assert(urlFields[0].key === 'originUrl');
    assert(urlFields[0].value.match(/http:\/\/localhost:\d+\/\?name=test/));
    const paramsFields = paramsLog.fields;
    assert(paramsFields[0].key === 'data');
    assert(paramsFields[0].value === '~age=100~');

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
      data: {
        age: 100
      }
    });
  });
});
