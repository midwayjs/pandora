import { Fixture, sleep } from '../../TestUtil';
import { HttpServerPatcher } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { consoleLogger } from 'pandora-dollar';

export default class HttpServerFixture extends Fixture {

  config() {

    return {
      patchers: {
        httpServer: {
          enabled: true,
          klass: HttpServerPatcher
        }
      }
    };
  }

  async case(done) {
    const http = require('http');
    const urllib = require('urllib');

    const spy = sinon.spy(consoleLogger, 'log');

    const server = http.createServer();

    server.listen(0);

    sleep(1000);

    const port = server.address().port;

    try {
      await urllib.request(`http://localhost:${port}`, {
        timeout: 1000
      });
    } catch (error) {
      assert(error.name === 'ResponseTimeoutError');
    }

    assert(spy.calledWith(sinon.match('[HttpServerPatcher] no requestListener, skip trace.')));

    spy.restore();

    done();
  }
}