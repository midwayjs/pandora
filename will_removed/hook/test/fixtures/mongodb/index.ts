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
  const mongodb = require('mongodb');

  process.on(<any>'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {
    assert(report);
    assert(report.spans.length > 4);

    done();
  });

  const server = http.createServer((req, res) => {
    mongodb.connect('mongodb://127.0.0.1:40001/test', (err, client) => {
      const coll = client.db('foo').collection('bar');

      return coll
        .insert({ a: 42 })
        .then(() => coll.findOne({}, { readConcern: { level: 'majority' } }))
        .then(() => {
          res.end('ok');
          return client.close();
        }).catch((err) => {
          console.log('mongodb error: ', err);
        });
    });
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

