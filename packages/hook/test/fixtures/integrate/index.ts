'use strict';

const assert = require('assert');
const EggLoggerPatcher = require('../../../src/patch/egg-logger');
const HttpPatcher = require('../../../src/patch/http');
const UrllibPatcher = require('../../../src/patch/urllib');
const BluebirdPatcher = require('../../../src/patch/bluebird');
const eggLoggerPatcher = new EggLoggerPatcher();
const httpPatcher = new HttpPatcher();
const urllibPatcher = new UrllibPatcher();
const bluebirdPatcher = new BluebirdPatcher();
const pedding = require('pedding');

run(function(done) {
  eggLoggerPatcher.run();
  httpPatcher.run();
  urllibPatcher.run();
  bluebirdPatcher.run();

  done = pedding(2, done);

  const http = require('http');
  const urllib = require('urllib');
  const Logger = require('egg-logger').Logger;
  const Promise = require('bluebird');
  const url = 'https://www.taobao.com/';
  const logger = new Logger();

  process.on('PANDORA_PROCESS_MESSAGE_TRACE', tracer => {
    assert(tracer.spans.length === 3);
    const parent = tracer.spans[0].context();
    const child = tracer.spans[1].context();
    const last = tracer.spans[2].context();
    assert(parent.spanId === child.parentId);
    assert(child.spanId === last.parentId);
    done();
  });

  process.on('PANDORA_PROCESS_MESSAGE_LOGGER', info => {
    const args = info.args;
    const err = args[0];
    assert(info.method === 'error');
    assert(err.message === 'hello');
    done();
  });

  const server = http.createServer((req, res) => {

    urllib.request(url).then(() => {

      return new Promise((resolve, reject) => {

        urllib.request(url, function(err) {
          if (err) return reject(err);

          resolve('hello');
        });
      });
    }).then((data) => {
      res.end(data);
      logger.error(new Error(data));
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      http.get(`http://localhost:${port}`);
    }, 500);
  });
});
