/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
import { MongodbPatcher } from '../../../src/patch/Mongodb';
import * as assert from 'assert';
import { HttpServerPatcher } from '../../../src/patch/HttpServer';

const httpServerPatcher = new HttpServerPatcher();
const mongodbPatcher = new MongodbPatcher();

RunUtil.run(function(done) {
  httpServerPatcher.run();
  mongodbPatcher.run();

  const http = require('http');
  const urllib = require('urllib');
  const mongoose = require('mongoose');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report);
    assert(report.spans.length >= 4);

    done();
  });

  const server = http.createServer((req, res) => {
    mongoose.connect('mongodb://127.0.0.1:40001/test');

    const Cat = mongoose.model('Cat', { name: String });

    Cat.findOne().then( () => res.end('ok') );
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      urllib.request(`http://localhost:${port}/?test=query`).catch((err) => {
        console.log('request error: ', err);
      });
    }, 500);
  });

});

