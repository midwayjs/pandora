import { Fixture, sleep } from '../../TestUtil';
import { EggLoggerPatcher } from '../../../src/patchers';
import { CURRENT_CONTEXT } from '../../../src/constants';
import * as sinon from 'sinon';
import * as assert from 'assert';
import * as pedding from 'pedding';
import * as fs from 'fs';

export default class EggLoggerFixture extends Fixture {

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
    const tmpLogFilePath = `/tmp/${Date.now()}_test_eggLoggerPatcher.log`;
    const _done = pedding(done, 2);

    const eggLoggerPatcher = this.autoPatching.instances.get('eggLogger');

    const stub = sinon.stub(eggLoggerPatcher.ctx.errorLogManager, 'record').callsFake(function(data) {
      assert(data);

      if (data.errType === 'FooError') {
        assert(data.message === 'error foo');
        assert(data.method === 'error');
        assert(data.stack);
        assert(data.path.match(/^\/tmp\/.*test_eggLoggerPatcher.log/));
        assert(data.traceId === '1234567890');
        return _done();
      }
      if (data.errType === 'WarningError') {
        assert(data.method === 'warn');
        assert(data.message === 'warn foo');
        assert(data.stack);
        assert(data.path.match(/^\/tmp\/.*test_eggLoggerPatcher.log/));
        assert(data.traceId === '1234567890');
        return _done();
      }
      if (data.errType === 'Error') {
        assert(data.method === 'error');
        assert(data.message === 'error string foo');
        assert(data.stack);
        assert(data.path.match(/^\/tmp\/.*test_eggLoggerPatcher.log/));
        assert(data.traceId === '1234567890');
        return _done();
      }
      assert(false, 'should not execute here');
    });

    let port;
    eggLoggerPatcher.cls.run(() => {

      const server = http.createServer(function(req, res) {
        const Logger = require('egg-logger').Logger;
        const FileTransport = require('egg-logger').FileTransport;
        const ConsoleTransport = require('egg-logger').ConsoleTransport;

        eggLoggerPatcher.cls.set(CURRENT_CONTEXT, {
          traceId: req.headers['x-trace-id']
        });

        const logger = new Logger();
        logger.set('file', new FileTransport({
          file: tmpLogFilePath,
          level: 'INFO',
        }));
        logger.set('console', new ConsoleTransport({
          level: 'DEBUG',
        }));
        logger.info('info foo');
        logger.warn('warn', 'foo');
        const error = new Error('error foo');
        error.name = 'FooError';
        logger.error(error);
        logger.error('error string foo');
        logger.log(null, 'log without level');

        res.end('ok');
      });

      server.listen(0);
      sleep(1000);
      port = server.address().port;

    });

    await urllib.request(`http://localhost:${port}/?test=query`, {
      headers: {
        'x-trace-id': '1234567890'
      }
    });
    fs.unlinkSync(tmpLogFilePath);
    stub.restore();
    await this.autoPatching.stop();
  }
}
