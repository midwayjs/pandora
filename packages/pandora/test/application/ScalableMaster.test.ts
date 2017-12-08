import {join, dirname} from 'path';
import {expect} from 'chai';
import urllib = require('urllib');
import {ScalableMaster} from '../../src/application/ScalableMaster';
import {defaultWorkerCount} from '../../src/const';

const pathProjectMaster = join(__dirname, '../fixtures/project/master');
const pathSimpleClusterApp = join(__dirname, '../fixtures/project/simple_cluster/app.js');

describe('ProcessMaster', function () {

  describe('mode procfile.js', function () {

    let processMaster: ScalableMaster = null;
    before(async () => {
      processMaster = new ScalableMaster({
        appName: 'test',
        processName: 'worker',
        appDir: pathProjectMaster
      });
    });

    it('should start be ok', async () => {
      await processMaster.start();
      expect(processMaster.getWorkers().length === defaultWorkerCount);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reload be ok', async () => {
      const beforeWorkers = processMaster.getWorkers();
      await processMaster.reload('worker');
      const afterWorkers = processMaster.getWorkers();
      expect(beforeWorkers.length).equal(afterWorkers.length);
      expect(beforeWorkers[0].pid).not.equal(afterWorkers[0].pid);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should stop be ok', async () => {
      await processMaster.stop();
      const workers = processMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(processMaster.started).equal(false);
    });

  });

  describe('mode cluster', function () {

    let processMaster: ScalableMaster = null;
    before(async () => {
      processMaster = new ScalableMaster({
        appName: 'test',
        processName: 'worker',
        appDir: dirname(pathSimpleClusterApp)
      });
    });

    it('should start be ok', async () => {
      await processMaster.start();
      expect(processMaster.getWorkers().length).equal(defaultWorkerCount);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reload be ok', async () => {
      const beforeWorkers = processMaster.getWorkers();
      await processMaster.reload('worker');
      const afterWorkers = processMaster.getWorkers();
      expect(beforeWorkers.length).equal(afterWorkers.length);
      expect(beforeWorkers[0].pid).not.equal(afterWorkers[0].pid);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should stop be ok', async () => {
      await processMaster.stop();
      const workers = processMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(processMaster.started).equal(false);
    });

    it('should be ok when given a scale option', async () => {
      const ownProcessMaster = new ScalableMaster({
        appName: 'test',
        processName: 'worker',
        appDir: dirname(pathSimpleClusterApp)
      });
      await ownProcessMaster.start();
      expect(ownProcessMaster.getWorkers().length).equal(2);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
      await processMaster.stop();
      const workers = processMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(processMaster.started).equal(false);
    });

  });

});
