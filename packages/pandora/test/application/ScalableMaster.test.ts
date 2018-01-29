import {join, dirname} from 'path';
import {expect} from 'chai';
import urllib = require('urllib');
import {ScalableMaster} from '../../src/application/ScalableMaster';
import {defaultWorkerCount, RELOAD, RELOAD_ERROR, RELOAD_SUCCESS} from '../../src/const';
import mm = require('mm');

const pathSimpleClusterApp = join(__dirname, '../fixtures/project/simple_cluster/app.js');

describe('ScalableMaster', function () {

  describe('basic', function() {

    afterEach(() => {
      mm.restore();
    });

    it('should reload() be ok', () => {

      const master = new ScalableMaster({
        appName: 'testApp',
        appDir: 'testDir',
        processName: 'testProcess'
      });

      let calledReloadWorkesTimes = 0;
      mm(master, 'reloadNamedWorkers', () => {
        calledReloadWorkesTimes++;
      });

      master.reload();
      master.reload('testProcess');
      master.reload('otherProcess');

      expect(calledReloadWorkesTimes).to.equal(2);

    });

    it('should onProcessMessage() be ok', async () => {

      const master = new ScalableMaster({
        appName: 'testApp',
        appDir: 'testDir',
        processName: 'testProcess'
      });

      const once = async () => {
        master.onProcessMessage({
          action: RELOAD,
          name: 'testProcess'
        });
        await new Promise((resolve, reject) => {
          mm(process, 'send', (msg) => {
            if(msg.action === RELOAD_SUCCESS) {
              resolve();
            } else if(msg.action === RELOAD_ERROR) {
              reject(msg.error);
            }
          });
        });
      };

      let called = false;
      mm(master, 'reload', async () => {
        called = true;
        await new Promise((resolve => {
          setTimeout(resolve, 100);
        }));
      });
      await once();
      expect(called).to.equal(true);

      called = false;
      mm(master, 'reload', async () => {
        called = true;
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Fake Error'));
          }, 100);
        });
      });
      await expect(once()).rejectedWith('Fake Error');
      expect(called).to.equal(true);

    });

  });

  describe('start and stop', function() {

    let scalableMaster: ScalableMaster = null;
    before(async () => {
      scalableMaster = new ScalableMaster({
        appName: 'test',
        scale: 2,
        processName: 'worker',
        appDir: dirname(pathSimpleClusterApp)
      });
    });

    it('should start be ok', async () => {
      await scalableMaster.start();
      expect(scalableMaster.getWorkers().length).equal(defaultWorkerCount);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reload be ok', async () => {
      const beforeWorkers = scalableMaster.getWorkers();
      await scalableMaster.reload('worker');
      const afterWorkers = scalableMaster.getWorkers();
      expect(beforeWorkers.length).equal(afterWorkers.length);
      expect(beforeWorkers[0].pid).not.equal(afterWorkers[0].pid);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reload be over process msg ok', async () => {
      const beforeWorkers = scalableMaster.getWorkers();
      await scalableMaster.reload('worker');

      const afterWorkers = scalableMaster.getWorkers();
      expect(beforeWorkers.length).equal(afterWorkers.length);
      expect(beforeWorkers[0].pid).not.equal(afterWorkers[0].pid);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should stop be ok', async () => {
      await scalableMaster.stop();
      const workers = scalableMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(scalableMaster.started).equal(false);
    });

    it('should be ok when given a scale option', async () => {
      const scalableMaster2 = new ScalableMaster({
        appName: 'test',
        processName: 'worker',
        appDir: dirname(pathSimpleClusterApp)
      });
      await scalableMaster2.start();
      expect(scalableMaster2.getWorkers().length).equal(2);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
      await scalableMaster.stop();
      const workers = scalableMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(scalableMaster.started).equal(false);
    });

  });

});
