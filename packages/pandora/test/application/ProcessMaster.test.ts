import mm = require('mm');
import {join, dirname} from 'path';
import {expect} from 'chai';
import urllib = require('urllib');
import {defaultWorkerCount, ProcessMaster} from '../../src/application/ProcessMaster';

const pathProjectMaster = join(__dirname, '../fixtrues/project/master');
const pathSimpleClusterApp = join(__dirname, '../fixtrues/project/simple_cluster/app.js');

describe('ProcessMaster', function () {

  describe('mode procfile.js', function () {

    let processMaster: ProcessMaster = null;
    before(async () => {
      processMaster = new ProcessMaster({
        mode: 'procfile.js',
        appName: 'test',
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

    it('should onProcessTerm be ok', async () => {
      let did = false;
      const promise = new Promise(resolve => {
        mm(process, 'exit', function (code) {
          if (0 === code) {
            did = true;
          }
          resolve();
        });
      });
      processMaster.onProcessTerm(2);
      await promise;
      mm.restore();
      expect(did).to.be.equal(true);
    });

    it('should stop be ok', async () => {
      await processMaster.stop();
      const workers = processMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(processMaster.started).equal(false);
    });

  });

  describe('mode cluster', function () {

    let processMaster: ProcessMaster = null;
    before(async () => {
      processMaster = new ProcessMaster({
        mode: 'cluster',
        appName: 'test',
        entryFile: pathSimpleClusterApp,
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
      const ownProcessMaster = new ProcessMaster({
        mode: 'cluster',
        appName: 'test',
        scale: 1,
        entryFile: pathSimpleClusterApp,
        appDir: dirname(pathSimpleClusterApp)
      });
      await ownProcessMaster.start();
      expect(ownProcessMaster.getWorkers().length).equal(1);
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
      await processMaster.stop();
      const workers = processMaster.getWorkers();
      expect(workers.length).equal(0);
      expect(processMaster.started).equal(false);
    });

  });

});
