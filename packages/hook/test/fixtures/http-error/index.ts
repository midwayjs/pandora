import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
// 放在前面，把 http.ClientRequest 先复写
import { HttpServerPatcher } from '../../../src/patch/HttpServer';
import { HttpClientPatcher } from '../../../src/patch/HttpClient';
import { ERROR_TRACE } from 'pandora-metrics';
const httpServerPatcher = new HttpServerPatcher();
const httpClientPatcher = new HttpClientPatcher();

RunUtil.run(function(done) {
  httpServerPatcher.run();
  httpClientPatcher.run();

  const http = require('http');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    const spans = report.spans;
    assert(spans.length === 2);
    assert(report.status & ERROR_TRACE);
    done();
  });

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
    request(http, {
      hostname: `www.${Date.now()}notfound.com`,
      path: '/',
      method: 'GET'
    }).catch((err) => {
      res.end('hello');
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
