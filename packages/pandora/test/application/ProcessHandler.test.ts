import {expect} from 'chai';
import {join, dirname} from 'path';
import {ProcessHandler} from '../../src/application/ProcessHandler';
import urllib = require('urllib');
import {State} from '../../src/const';

const pathProjectMaster = join(__dirname, '../fixtures/project/master');
const pathSimpleForkApp = join(__dirname, '../fixtures/project/simple_fork/app.js');

describe('ProcessHandler', function () {

  describe('scale great than 1', function () {
    let processHandler: ProcessHandler = null;
    before(async () => {
      processHandler = new ProcessHandler({
        appName: 'test',
        processName: 'worker',
        appDir: pathProjectMaster,
        scale: 2,
        entryFile: join(pathProjectMaster, 'SimpleHTTPServer.js')
      });
    });

    it('should start be ok', async () => {
      await processHandler.start();
      expect(processHandler.state).equal(State.complete);
      expect(processHandler.pid).to.be.ok;
      expect(processHandler.appName).equal('test');
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reload be ok', async () => {
      await processHandler.reload();
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should stop be ok', async () => {
      await processHandler.stop();
      expect(processHandler.state).equal(State.stopped);
      expect(processHandler.pid).to.equal(null);
    });
  });

  describe('scale equal 1', function () {
    let processHandler: ProcessHandler = null;
    before(async () => {
      processHandler = new ProcessHandler({
        appName: 'test',
        processName: 'worker',
        scale: 1,
        entryFile: pathSimpleForkApp,
        appDir: dirname(pathSimpleForkApp)
      });
    });

    it('should start be ok', async () => {
      await processHandler.start();
      expect(processHandler.state).equal(State.complete);
      expect(processHandler.pid).to.be.ok;
      expect(processHandler.appName).equal('test');
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('simple_fork');
    });

    it('should reload be ok', async () => {
      await processHandler.reload();
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('simple_fork');
    });

    it('should stop be ok', async () => {
      await processHandler.stop();
      expect(processHandler.state).equal(State.stopped);
      expect(processHandler.pid).to.equal(null);
    });
  });

});
