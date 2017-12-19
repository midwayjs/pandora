'use strict';
import {RunUtil} from '../../RunUtil';
const nock = require('nock');
const assert = require('assert');
const {EggLoggerPatcher, HttpPatcher, HttpClientPatcher, BluebirdPatcher} = require('../../../src/index');
const eggLoggerPatcher = new EggLoggerPatcher();
const httpPatcher = new HttpPatcher();
const httpClientPatcher = new HttpClientPatcher({
  forceHttps: true
});
const bluebirdPatcher = new BluebirdPatcher();
const pedding = require('pedding');
const semver = require('semver');

RunUtil.run(function(done) {
  eggLoggerPatcher.run();
  httpPatcher.run();
  httpClientPatcher.run();
  bluebirdPatcher.run();

  done = pedding(2, done);

  const http = require('http');
  const https = require('https');
  const Logger = require('egg-logger').Logger;
  const Promise = require('bluebird');
  const logger = new Logger();

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report.spans.length === 3);
    const parent = report.spans[0].context;
    const child = report.spans[1].context;
    const last = report.spans[2].context;
    assert(parent.spanId === child.parentId);
    assert(child.spanId === last.parentId);
    done();
  });

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_LOGGER', (info: any) => {
    assert(info.message === 'hello');
    done();
  });

  nock('https://www.baidu.com/')
    .get('/')
    .twice()
    .reply(200);

  function request(agent, options) {

    return new Promise((resolve, reject) => {
      const req = agent.request(options, (res) => {
        let data = '';

        res.on('data', (d) => {
          data += d;
        });

        res.on('end', () => {
          resolve(data);
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
      hostname: 'www.baidu.com',
      path: '/',
      method: 'GET'
    }).then(() => {
      console.log('second request');
      return new Promise((resolve, reject) => {
        console.log('do this');
        const req = https.request({
          hostname: 'www.baidu.com',
          path: '/',
          method: 'GET'
        }, function(err) {
          console.log('third request');
          if (err) return reject(err);

          resolve('hello');
        });

        req.end();
      });
    }).then((data) => {
      res.end(data);
      logger.error(new Error(data));
    }).catch((err) => {
      console.log('err: ', err);
    });
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      if (semver.satisfies(<any>process.version, '>=8')) {
        http.get({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'GET'
        }, (res) => {
          console.log('first request result: ', res);
        });
      } else {
        http.request({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'GET'
        }, (res) => {
          console.log('first request result: ', res);
        });
      }

    }, 500);
  });
});
