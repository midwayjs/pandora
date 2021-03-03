import * as $ from '@pandorajs/dollar';

import { expect } from 'chai';
import { FileLoggerManager } from '../src/FileLoggerManager';
import Path = require('path');
import fs = require('fs');
import mkdirp = require('mkdirp');
import mm = require('mm');

const tmpDir = Path.join(__dirname, '.tmp');
mkdirp.sync(tmpDir);

class OwnLoggerManager extends FileLoggerManager {
  testReload() {
    this.reload();
  }
  testReloadAllUUID() {
    for (const uuid of this.loggerMap.keys()) {
      this.reload(uuid);
    }
  }
}

describe('#FileLoggerManager', () => {
  describe('#Simple', () => {
    const loggerManager = new OwnLoggerManager();
    it('should create a logger be ok', async () => {
      const logger = loggerManager.createLogger('create', {
        name: 'create',
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL',
      });
      expect(logger).be.ok;
    });
    it('should write those levels be ok', async () => {
      const logger = loggerManager.createLogger('levels', {
        name: 'levels',
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL',
      });
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
    });

    it('should skip write file works well', async () => {
      fs.writeFileSync(Path.join(tmpDir, 'levels'), '');
      let logger = loggerManager.createLogger('levels', {
        name: 'levels',
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL',
      });
      logger.debug('debug');
      logger.error('error');
      await new Promise(r => setTimeout(r, 1000));
      let content = fs.readFileSync(Path.join(tmpDir, 'levels'));
      expect(content.toString()).to.be.equal('');

      mm(loggerManager, 'stopWriteWhenNoSupervisor', false);
      logger = loggerManager.createLogger('levels', {
        name: 'levels',
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL',
      });
      logger.debug('debug');
      logger.error('error');
      await new Promise(r => setTimeout(r, 2000));

      content = fs.readFileSync(Path.join(tmpDir, 'levels'));
      expect(content.toString().split('\n').length).to.be.equal(3);
    });

    it('should reload be ok', async () => {
      loggerManager.testReload();
      loggerManager.testReloadAllUUID();
    });
  });

  // describe('#EventEmitter', () => {
  //   const loggerManager  = new OwnLoggerManager;
  //
  //   it('should emit be ok', async () => {
  //     const logger = loggerManager.createLogger('event-emitter', {
  //       dir: tmpDir
  //     });
  //     let emited = false;
  //     loggerManager.on('log', (msg) => {
  //       expect(msg.loggerName).to.equal('event-emitter');
  //       expect(msg.fileName).to.equal('event-emitter.log');
  //       expect(msg.level).to.equal('WARN');
  //       expect(msg.formattedMessage).to.have.string('test');
  //       emited = true;
  //     });
  //     logger.warn('test');
  //     expect(emited).to.equal(true);
  //   });
  // });

  describe('#connectRotator', () => {
    let loggerManager;
    let heartbeatCount = 0;
    let triggerEvent;
    let sendThrowError = false;

    before(() => {
      loggerManager = new OwnLoggerManager({
        connectRotator: true,
        heartbeatTime: 200,
      });
      loggerManager.setMessengerClient({
        ready: fn => {
          if (typeof fn === 'function') {
            fn();
          }
        },
        on: (action, cb) => {
          triggerEvent = cb;
        },
        send: (action, data) => {
          if (data.type === 'logger-heartbeat') {
            if (sendThrowError) {
              throw new Error('mock error');
            }
            heartbeatCount++;
          }
        },
      });
    });
    after(() => {
      mm.restore();
    });

    it('should called start() be ok', async () => {
      await loggerManager.start();
    });

    it('should heartbeat be ok', async () => {
      expect(heartbeatCount).equal(0);
      sendThrowError = true;
      loggerManager.createLogger('heartbeat', {
        dir: tmpDir,
        stdoutLevel: 'ALL',
        level: 'ALL',
      });
      await $.promise.delay(500);
      sendThrowError = false;
      await $.promise.delay(500);
      expect(heartbeatCount > 1).be.ok;
    });

    it('should handing reload by broadcast be ok', async () => {
      triggerEvent({
        type: 'logger-reload',
      });
    });
  });
});
