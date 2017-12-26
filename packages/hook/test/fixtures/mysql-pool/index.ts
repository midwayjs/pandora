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

  process.on('PANDORA_PROCESS_MESSAGE_TRACE', report => {
    assert(report.spans.length === 2);
    const mysqlSpan = report.spans[1];
    assert(mysqlSpan.name === 'mysql');
    assert(mysqlSpan.tags['mysql.method'].value === 'pool#query');

    done();
  });

  const server = http.createServer((req, res) => {
    const pool = mysql.createPool({
      port: fakeServerPort
    });

    pool.query('SELECT 1', function(err, row, fields) {
      pool.end();
      res.end('ok');
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      urllib.request(`http://localhost:${port}/?test=query`);
    }, 500);
  });
});