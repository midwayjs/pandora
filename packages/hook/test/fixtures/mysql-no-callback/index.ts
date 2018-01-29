/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
const assert = require('assert');
const { HttpServerPatcher } = require('../../../src/patch/HttpServer');
const { MySQLPatcher } = require('../../../src/patch/MySQL');
const httpServerPatcher = new HttpServerPatcher();
const mysqlPatcher = new MySQLPatcher();

const fakeServerPort = 32893;

RunUtil.run(function(done) {
  httpServerPatcher.run();
  mysqlPatcher.run();

  const http = require('http');
  const urllib = require('urllib');
  const mysql = require('mysql');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report.spans.length === 1);

    done();
  });

  const server = http.createServer((req, res) => {
    const connection = mysql.createConnection({
      port: fakeServerPort
    });

    connection.connect();

    connection.query('SELECT 1');

    setTimeout(function() {
      connection.end();
      res.end('ok');
    }, 2000);
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      urllib.request(`http://localhost:${port}/?test=query`);
    }, 500);
  });
});