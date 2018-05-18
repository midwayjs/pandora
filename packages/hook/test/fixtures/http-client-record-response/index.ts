import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
import { gzipSync, unzipSync } from 'zlib';
// 放在前面，把 http.ClientRequest 先复写
const nock = require('nock');
import { HttpServerPatcher, HttpClientPatcher } from '../../../src/';
const httpServerPatcher = new HttpServerPatcher();
const httpClientPatcher = new HttpClientPatcher({
  // nock 复写了 https.request 方法，没有像原始一样调用 http.request，所以需要强制复写
  forceHttps: true,
  recordResponse: true,
  bufferTransformer: (buffer, res) => {
    const encoding = res.headers['content-encoding'];
    let data = buffer;

    if (encoding === 'gzip') {
      data = unzipSync(data);
    }

    return data.toString('utf8');
  }
});

RunUtil.run(function(done) {
  httpServerPatcher.run();
  httpClientPatcher.run();

  const http = require('http');
  const https = require('https');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    const spans = report.spans;
    assert(spans.length === 2);
    const logs = spans[1].logs;
    const fields = logs[0].fields;
    assert(fields[0].key === 'response');
    assert(fields[0].value === 'Response from TaoBao.');

    done();
  });

  nock('https://www.taobao.com')
    .get('/')
    .reply(200, gzipSync(Buffer.from('Response from TaoBao.')), {
      'Content-Encoding': 'gzip'
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
    request(https, {
      hostname: 'www.taobao.com',
      path: '/',
      method: 'GET'
    }).then((response) => {
      res.end('ok');
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      request(http, {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET'
      }).catch((err) => {
        console.log('err: ', err);
      });
    }, 500);
  });
});

