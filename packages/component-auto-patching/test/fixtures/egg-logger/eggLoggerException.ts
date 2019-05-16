import { Fixture, sleep } from '../../TestUtil';
import { EggLoggerPatcher } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';

export default class EggLoggerExceptionFixture extends Fixture {

  config() {

    return {
      patchers: {
        eggLogger: {
          enabled: true,
          klass: EggLoggerPatcher
        }
      }
    };
  }

  async case(done) {
    const http = require('http');
    const urllib = require('urllib');

    const eggLoggerPatcher = this.autoPatching.instances.get('eggLogger');

    const stub = sinon.stub(eggLoggerPatcher.ctx.errorLogManager, 'record').callsFake(function(data) {
      throw new Error('mock error');
    });

    const server = http.createServer(function(req, res) {
      const Logger = require('egg-logger').Logger;
      const ConsoleTransport = require('egg-logger').ConsoleTransport;


      const logger = new Logger();
      logger.set('console', new ConsoleTransport({
        level: 'DEBUG',
      }));

      const loggerSpy = sinon.spy(logger, 'log');
      logger.warn('warn', 'foo');

      res.end('ok');

      assert(loggerSpy.calledWithMatch('WARN', {0: 'warn', 1: 'foo'}));
      done();
    });

    server.listen(0);
    sleep(1000);
    const port = server.address().port;

    await urllib.request(`http://localhost:${port}/?test=query`, {
      headers: {
        'x-trace-id': '1234567890'
      }
    });

    stub.restore();
  }
}
