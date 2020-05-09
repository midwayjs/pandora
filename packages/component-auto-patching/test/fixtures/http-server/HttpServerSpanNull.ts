import { Fixture, sleep } from '../../TestUtil';
import { HttpServerPatcher } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { consoleLogger } from '@pandorajs/dollar';

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

    const httpServerPatcher = this.autoPatching.instances.get('httpServer');
    const stub = sinon.stub(httpServerPatcher, 'tracer').value(null);

    const spy = sinon.spy(consoleLogger, 'info');

    const server = http.createServer(function(req, res) {
      setTimeout(() => {
        res.end('OK');
      },  Math.floor(1 + Math.random() * 10) * 100);
    });

    server.listen(0);

    sleep(1000);

    const port = server.address().port;
    await urllib.request(`http://localhost:${port}`);

    assert(spy.calledWith(sinon.match('[HttpServerPatcher] span is null, skip trace.')));

    stub.restore();
    spy.restore();

    done();
  }
}
