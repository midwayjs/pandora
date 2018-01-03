import {expect} from 'chai';
import mm = require('mm');
import DaemonHandler = require('../../src/daemon/DaemonHandler');

describe('DaemonHandler', function () {

  after(async () => {
    const isRunning = await DaemonHandler.isDaemonRunning();
    if (!isRunning) {
      return;
    }
    await new Promise(resolve => {
      DaemonHandler.send('exit', {}, function () {
        resolve();
      });
      setTimeout(resolve, 1000);
    });
  });

  it('should isDaemonRunning() be ok when no daemon running', async () => {
    const isRunning = await DaemonHandler.isDaemonRunning();
    expect(isRunning).to.equal(false);
  });

  it('should barrierDaemon() be ok', async () => {
    const isRunning1 = await DaemonHandler.isDaemonRunning();
    expect(isRunning1).to.equal(false);
    await DaemonHandler.barrierDaemon();
    const isRunning2 = await DaemonHandler.isDaemonRunning();
    expect(isRunning2).to.equal(true);
  });

  it('should send() be ok', async () => {
    await DaemonHandler.barrierDaemon();
    await new Promise((resolve, reject) => {
      DaemonHandler.send('list', {}, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  });

  it('should clearCliExit() daemon be ok', async () => {
    let did = false;
    await DaemonHandler.barrierDaemon();
    const isRunning1 = await DaemonHandler.isDaemonRunning();
    expect(isRunning1).to.equal(true);
    const promise = new Promise(resolve => {
      mm(process, 'exit', function (code) {
        if (code === 0) {
          did = true;
          resolve();
        }
      });
    });
    await DaemonHandler.clearCliExit(0);
    await promise;
    const isRunning2 = await DaemonHandler.isDaemonRunning();
    expect(isRunning2).to.equal(false);
    expect(did).to.equal(true);
    mm.restore();
  });

  it('should exit daemon be ok', async () => {
    await DaemonHandler.barrierDaemon();
    const isRunning1 = await DaemonHandler.isDaemonRunning();
    expect(isRunning1).to.equal(true);
    await new Promise(resolve => {
      DaemonHandler.send('exit', {}, function () {
        resolve();
      });
      setTimeout(resolve, 1000);
    });
    const isRunning2 = await DaemonHandler.isDaemonRunning();
    expect(isRunning2).to.equal(false);
  });

});
