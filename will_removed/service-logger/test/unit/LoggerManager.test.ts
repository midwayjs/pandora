import * as $ from 'pandora-dollar';
import {SOCKET_FILE_NAME} from '../../src/domain';

import {expect} from 'chai';
import {LoggerManager} from '../../src';
import Path = require('path');
import mkdirp = require('mkdirp');
import mm = require('mm');
import Messenger from 'pandora-messenger';

const tmpDir = Path.join(__dirname, '.tmp');
mkdirp.sync(tmpDir);

class OwnLoggerManager extends LoggerManager {
  testReload () {
    this.reload();
  }
  testReloadAllUUID () {
    for(let uuid of this.loggerMap.keys()) {
      this.reload(uuid);
    }
  }
}

describe('#LoggerManager', () => {

  describe('#Simple', () => {
    const loggerManager  = new OwnLoggerManager;
    it('should create a logger be ok', async () => {
      const logger = loggerManager.createLogger('create', {
        name: 'create',
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL'
      });
      expect(logger).be.ok;
    });
    it('should write those levels be ok', async () => {
      const logger = loggerManager.createLogger('levels', {
        name: 'levels',
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL'
      });
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
    });
    it('should reload be ok', async () => {
      loggerManager.testReload();
      loggerManager.testReloadAllUUID();
    });
  });

  describe('#EventEmitter', () => {
    const loggerManager  = new OwnLoggerManager;

    it('should emit be ok', async () => {
      const logger = loggerManager.createLogger('event-emitter', {
        dir: tmpDir
      });
      let emited = false;
      loggerManager.on('log', (msg) => {
        expect(msg.loggerName).to.equal('event-emitter');
        expect(msg.fileName).to.equal('event-emitter.log');
        expect(msg.level).to.equal('WARN');
        expect(msg.formattedMessage).to.have.string('test');
        emited = true;
      });
      logger.warn('test');
      expect(emited).to.equal(true);
    });
  });

  describe('#connectRotator', () => {
    let loggerManager;
    let calledGetClient = false;
    let heartbeatCount = 0;
    let triggerEvent;
    let sendThrowError = false;

    before(() => {
      mm(Messenger, 'getClient', (options) => {
        expect(options.name).equal(SOCKET_FILE_NAME);
        calledGetClient = true;
        return {
          ready: (fn) => {
            if(typeof fn === 'function') {
              fn();
            }
          },
          on: (action, cb) => {
            triggerEvent = cb;
          },
          send: (action, data) => {
            if(data.type === 'logger-heartbeat') {
              if(sendThrowError) {
                throw new Error('mock error');
              }
              heartbeatCount++;
            }
          }
        };
      });
      loggerManager = new OwnLoggerManager({
        connectRotator: true,
        heartbeatTime: 200
      });
    });
    after(() => {
      mm.restore();
    });

    it('should called Messenger.getClient be ok', async () => {
      expect(calledGetClient).be.ok;
    });

    it('should heartbeat be ok', async () => {
      expect(heartbeatCount).equal(0);
      sendThrowError = true;
      loggerManager.createLogger('heartbeat', {
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL'
      });
      await $.promise.delay(500);
      sendThrowError = false;
      await $.promise.delay(500);
      expect(heartbeatCount > 1).be.ok;
    });

    it('should handing reload by broadcast be ok', async () => {
      triggerEvent({
        type: 'logger-reload'
      });
    });

  });

});
