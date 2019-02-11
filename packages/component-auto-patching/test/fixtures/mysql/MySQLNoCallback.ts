import { Fixture, sleep } from '../../TestUtil';
import { HttpServerPatcher, MySQLPatcher, MySQLWrapper } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { consoleLogger } from 'pandora-dollar';

export default class MySQLFixture extends Fixture {

  config() {

    return {
      patchers: {
        httpServer: {
          enabled: true,
          klass: HttpServerPatcher
        },
        mySQL: {
          enabled: true,
          klass: MySQLPatcher,
          kWrapper: MySQLWrapper
        }
      }
    };
  }

  async case(done) {
    const http = require('http');
    const urllib = require('urllib');
    const mysql = require('mysql');

    const spy = sinon.spy(consoleLogger, 'info');

    const server = http.createServer(function(req, res) {
      setTimeout(() => {
        const connection = mysql.createConnection({
          port: 32893
        });

        connection.connect();
        connection.query('SELECT 1');

        assert(spy.calledWith(sinon.match('[MySQLWrapper] query callback null, ignore trace.')));
        spy.restore();
        connection.end();
        sleep(1000);
        done();
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
