import {MsgHeartbeatPayload, MsgPkg, MsgSendStrategyPayload, SOCKET_FILE_NAME} from '../../src/domain';
import {expect} from 'chai';
import * as $ from 'pandora-dollar';
import {FileLoggerRotator} from '../../src/FileLoggerRotator';

import mm = require('mm');
import mkdirp = require('mkdirp');
import Path = require('path');
import moment = require('moment');
import fs = require('mz/fs');
const tmpDir = Path.join(__dirname, '.tmp');
mkdirp.sync(tmpDir);

class OwnLoggerRotator extends FileLoggerRotator {
  countStrategies(): number {
    return this.strategyMap.size;
  }
  testRenameLogfile(filename) {
    return this.renameLogfile(filename);
  }
  testRotateLogByDate() {
    return this.rotateLogByDate();
  }
  testRotateLogBySize() {
    return this.rotateLogBySize();
  }
  removeAllStrategyAndRestart() {
    for(let uuid of this.strategyMap.keys()) {
      this.removeStrategyWithoutRestart(uuid);
    }
    this.start();
  }
  hasStrategy(uuid) {
    return this.strategyMap.has(uuid);
  }
  public getFilteredStrategiesList() {
    return super.getFilteredStrategiesList();
  }
  public getStrategiesRotateByDate() {
    return super.getStrategiesRotateByDate();
  }
  public getStrategiesRotateBySize() {
    return super.getStrategiesRotateBySize();
  }
}

describe('#LoggerRotator', () => {

  let loggerRotator, triggerEvent, broadcastThrowError = false, broadcastedReload = false;

  before(async () => {
    loggerRotator = new OwnLoggerRotator({
      heartbeatCheckTime: 300,
      heartbeatTimeMax: 2000
    });
    loggerRotator.setMessengerServer({
      ready: (cb) => {
        cb && cb();
      },
      on: (action, cb) => {
        triggerEvent = cb;
      },
      broadcast: (action, data) => {
        if(broadcastThrowError) {
          throw new Error('mock error');
        }
        if(data.type === 'logger-reload') {
          broadcastedReload = true;
        }
      }
    });
    await loggerRotator.start();
  });
  after(() => {
    mm.restore();
  });


  describe('#Simple', () => {

    it('should renameLogfile be ok', async () => {
      loggerRotator.removeAllStrategyAndRestart();
      const testFilePath = Path.join(tmpDir, Date.now() + 'renameLogfile.log');
      await fs.writeFile(testFilePath, 'test');
      await loggerRotator.testRenameLogfile(testFilePath);
      const affix = moment().subtract(1, 'days').format('.YYYY-MM-DD');
      const archivedFilePath = testFilePath + affix;
      await fs.stat(archivedFilePath);
    });

    it('should receiveStrategy and rotateLogByDate() be ok', async () => {
      loggerRotator.removeAllStrategyAndRestart();
      broadcastedReload = false;

      const uuid = 'receiveStrategyTestDate';
      const testFilePathOnReceiveStrategy = Path.join(tmpDir, Date.now() + 'receiveStrategyTestDate.log');
      await fs.writeFile(testFilePathOnReceiveStrategy, 'test');
      loggerRotator.receiveStrategy({
        uuid: uuid,
        type: 'date',
        file: testFilePathOnReceiveStrategy
      });
      await loggerRotator.testRotateLogByDate();

      const affix = moment().subtract(1, 'days').format('.YYYY-MM-DD');
      const archivedFilePath = testFilePathOnReceiveStrategy + affix;
      await fs.stat(archivedFilePath);
      expect(broadcastedReload).to.be.ok;
    });


    it('should receiveStrategy and rotateLogBySize() be ok', async () => {
      loggerRotator.removeAllStrategyAndRestart();
      broadcastedReload = false;

      const uuid = 'receiveStrategyTestSize';
      const testFilePathOnReceiveStrategy = Path.join(tmpDir, Date.now() + 'receiveStrategyTestSize.log');
      loggerRotator.receiveStrategy({
        uuid: uuid,
        type: 'size',
        file: testFilePathOnReceiveStrategy,
        maxFileSize: 1024
      });

      await fs.writeFile(testFilePathOnReceiveStrategy, '*'.repeat(1025));
      await loggerRotator.testRotateLogBySize();
      const archivedFilePath1 = testFilePathOnReceiveStrategy + '.1';
      await fs.stat(archivedFilePath1);

      await fs.writeFile(testFilePathOnReceiveStrategy, '*'.repeat(1025));
      await loggerRotator.testRotateLogBySize();
      const archivedFilePath2 = testFilePathOnReceiveStrategy + '.2';
      await fs.stat(archivedFilePath2);

      await fs.writeFile(testFilePathOnReceiveStrategy, '*'.repeat(1025));
      await loggerRotator.testRotateLogBySize();
      const archivedFilePath3 = testFilePathOnReceiveStrategy + '.3';
      await fs.stat(archivedFilePath3);

      expect(broadcastedReload).to.be.ok;
    });

    it('should filter same path', () => {

      loggerRotator.removeAllStrategyAndRestart();

      const testFilePathOnReceiveStrategy1 = Path.join(tmpDir, Date.now() + 'receiveStrategyTestSamePath1.log');
      const testFilePathOnReceiveStrategy2 = Path.join(tmpDir, Date.now() + 'receiveStrategyTestSamePath2.log');

      loggerRotator.receiveStrategy({
        uuid: 'receiveStrategyTestSamePath1',
        type: 'size',
        file: testFilePathOnReceiveStrategy1
      });
      loggerRotator.receiveStrategy({
        uuid: 'receiveStrategyTestSamePath2',
        type: 'size',
        file: testFilePathOnReceiveStrategy1
      });

      loggerRotator.receiveStrategy({
        uuid: 'receiveStrategyTestSamePath3',
        type: 'date',
        file: testFilePathOnReceiveStrategy2
      });
      loggerRotator.receiveStrategy({
        uuid: 'receiveStrategyTestSamePath4',
        type: 'date',
        file: testFilePathOnReceiveStrategy2
      });

      expect(loggerRotator.getFilteredStrategiesList().length).equal(2);
      expect(loggerRotator.getStrategiesRotateByDate().length).equal(1);
      expect(loggerRotator.getStrategiesRotateBySize().length).equal(1);

    });

  });

  describe('#IPC', () => {

    it('should heartbeat works', async () => {
      loggerRotator.removeAllStrategyAndRestart();

      const uuid = 'heartbeatWorks';
      const testFilePathOnReceiveStrategy = Path.join(tmpDir, Date.now() + 'heartbeatWorks.log');
      loggerRotator.receiveStrategy({
        uuid: uuid,
        type: 'date',
        file: testFilePathOnReceiveStrategy
      });
      expect(loggerRotator.countStrategies()).equal(1);
      await $.promise.delay(1500);
      triggerEvent(<MsgPkg> {
        type: 'logger-heartbeat',
        payload: <MsgHeartbeatPayload> {
          uuid: uuid
        }
      });
      await $.promise.delay(1500);
      expect(loggerRotator.countStrategies()).equal(1);
    });

    it('should remove when heartbeat timeout', async () => {
      loggerRotator.removeAllStrategyAndRestart();
      const testFilePathOnReceiveStrategy = Path.join(tmpDir, Date.now() + 'heartbeatTimeout.log');
      loggerRotator.receiveStrategy({
        uuid: 'heartbeatTimeout',
        type: 'date',
        file: testFilePathOnReceiveStrategy
      });
      expect(loggerRotator.countStrategies()).equal(1);
      await $.promise.delay(3000);
      expect(loggerRotator.countStrategies()).equal(0);
    });


    it('should receiveStrategy by IPC', () => {
      loggerRotator.removeAllStrategyAndRestart();
      const uuid = 'receiveStrategyByIPC';
      const testFilePathOnReceiveStrategy = Path.join(tmpDir, Date.now() + 'receiveStrategyByIPC.log');
      triggerEvent(<MsgPkg> {
        type: 'logger-send-strategy',
        payload: <MsgSendStrategyPayload> {
          strategy: {
            uuid: uuid,
            type: 'date',
            file: testFilePathOnReceiveStrategy
          }
        }
      }, (resp) => {
        console.log(resp);
      });
      expect(loggerRotator.hasStrategy(uuid)).to.be.ok;
    });

  });


});
