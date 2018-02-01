/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
const assert = require('assert');
const { HttpServerPatcher } = require('../../../src/patch/HttpServer');
const { RedisPatcher } = require('../../../src/patch/Redis');
const httpServerPatcher = new HttpServerPatcher();
const redisPatcher = new RedisPatcher();

const fakeServerPort = 30001;

RunUtil.run(function(done) {
  httpServerPatcher.run();
  redisPatcher.run();

  const http = require('http');
  const urllib = require('urllib');
  const Redis = require('ioredis');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report);
    const spans = report.spans;
    assert(spans.length === 3);

    done();
  });

  const redis = new Redis({port: fakeServerPort});

  const server = http.createServer((req, res) => {

    redis.set('test-redis', 'callback', () => {
      redis.get('test-redis', (err, data) => {
        assert(data === 'callback');

        res.end(data);
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