import { Fixture, sleep } from '../../TestUtil';
import {
  HttpServerPatcher,
  MySQLPatcher
} from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';

export default class MySQLFixture extends Fixture {

  config() {

    return {
      patchers: {
        httpServer: {
          enabled: true,
          klass: HttpServerPatcher
        },
        mysql: {
          enabled: true,
          klass: MySQLPatcher
        }
      }
    };
  }

  async case(done) {
    const http = require('http');
    const urllib = require('urllib');
    const mysql = require('mysql');

    const mysqlPatcher = this.autoPatching.instances.get('mysql');
    mysqlPatcher.unattach();

    const spy = sinon.spy(this.componentTrace.traceManager, 'record');

    const server = http.createServer(function(req, res) {
      setTimeout(() => {
        const connection = mysql.createConnection({
          port: 32893
        });

        connection.connect();

        connection.query('SELECT 1', function(err, row, fields) {
          connection.end();
          assert(spy.calledOnce);
          spy.restore();
          res.end('ok');
          done();
        });
      },  Math.floor(1 + Math.random() * 10) * 100);
    });

    server.listen(0);

    sleep(1000);

    const port = server.address().port;

    await urllib.request(`http://localhost:${port}/?test=query`, {
      headers: {
        'x-trace-id': '1234567890'
      }
    });
  }
}
