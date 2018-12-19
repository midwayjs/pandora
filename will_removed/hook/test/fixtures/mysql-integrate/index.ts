import { RunUtil } from '../../RunUtil';
const assert = require('assert');
const nock = require('nock');
const { HttpServerPatcher } = require('../../../src/patch/HttpServer');
const { MySQLPatcher } = require('../../../src/patch/MySQL');
const { HttpClientPatcher } = require('../../../src/patch/HttpClient');
const httpServerPatcher = new HttpServerPatcher();
const mysqlPatcher = new MySQLPatcher();
const httpClientPatcher = new HttpClientPatcher({
  // nock 复写了 https.request 方法，没有像原始一样调用 http.request，所以需要强制复写
  forceHttps: true
});

const fakeServerPort = 32893;

RunUtil.run(function(done) {
  httpServerPatcher.run();
  httpClientPatcher.run();
  mysqlPatcher.run();

  const http = require('http');
  const urllib = require('urllib');
  const mysql = require('mysql');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    const spans = report.spans;
    assert(spans.length === 3);
    const mysqlSpan = report.spans[1];
    const httpClientSpan = report.spans[2];

    assert(httpClientSpan.context.parentId === mysqlSpan.context.spanId);

    done();
  });

  nock('https://www.taobao.com')
    .get('/')
    .reply(200);

  const server = http.createServer((req, res) => {
    const connection = mysql.createConnection({
      port: fakeServerPort
    });

    connection.connect();

    connection.query('SELECT 1', function(err, row, fields) {
      connection.end();

      urllib.request('https://www.taobao.com/').then(() => {
        res.end('ok');
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