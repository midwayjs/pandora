/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
const assert = require('assert');
const { HttpServerPatcher } = require('../../../src/patch/HttpServer');
const { MySQL2Patcher } = require('../../../src/patch/MySQL2');
const httpServerPatcher = new HttpServerPatcher();
const mysql2Patcher = new MySQL2Patcher();

const serverPort = 32883;

RunUtil.run(function(done) {
  httpServerPatcher.run();
  mysql2Patcher.run();

  const http = require('http');
  const urllib = require('urllib');
  const mysql = require('mysql2');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report.spans.length === 2);
    const mysqlSpan = report.spans[1];
    assert(mysqlSpan.name === 'mysql');
    assert(mysqlSpan.tags['mysql.method'].value === 'query');

    done();
  });

  const server = http.createServer((req, res) => {
    mysql.createConnectionPromise({
      port: serverPort
    }).then((connection) => {
      connection.query('SELECT 1', function(err, row, fields) {
        connection.end();
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