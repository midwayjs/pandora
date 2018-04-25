import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
import { HttpServerPatcher } from '../../../src/patch/HttpServer';

const httpServerPatcher = new HttpServerPatcher();

RunUtil.run(function(done) {
  httpServerPatcher.run();
  const http = require('http');
  const httpclient = require('urllib').create();

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report.name === 'HTTP-GET:/');
    assert(report.spans.length === 1);
    assert(report.duration <= 1000);
    const span = report.spans[0];
    const tag = span.tags['http.aborted'];
    assert(tag.value);

    done();
  });

  const server = http.createServer((req, res) => {

    setTimeout(function() {
      res.end('hello');
    }, 3000);

  });

  server.listen(0, () => {
    const port = server.address().port;

    const req = httpclient.request(`http://localhost:${port}`, function(err, body) {
      console.log('body size: %d', body.length);
    });

    setTimeout(function() {
      req.abort();
    }, 1000);
  });
});
