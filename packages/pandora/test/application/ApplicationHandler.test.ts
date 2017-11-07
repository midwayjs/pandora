import {expect} from 'chai';
import {join, dirname} from 'path';
import {ApplicationHandler} from '../../src/application/ApplicationHandler';
import urllib = require('urllib');
import {State} from '../../src/const';

const pathProjectMaster = join(__dirname, '../fixtures/project/master');
const pathSimpleForkApp = join(__dirname, '../fixtures/project/simple_fork/app.js');

describe('ApplicationHandler', function () {

  describe('mode procfile.js', function () {
    let applicationHandler: ApplicationHandler = null;
    before(async () => {
      applicationHandler = new ApplicationHandler({
        mode: 'procfile.js',
        appName: 'test',
        appDir: pathProjectMaster
      });
    });

    it('should start be ok', async () => {
      await applicationHandler.start();
      expect(applicationHandler.state).equal(State.complete);
      expect(applicationHandler.appId).to.be.ok;
      expect(applicationHandler.name).equal('test');
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reload be ok', async () => {
      await applicationHandler.reload();
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should stop be ok', async () => {
      await applicationHandler.stop();
      expect(applicationHandler.state).equal(State.stopped);
      expect(applicationHandler.appId).to.equal(null);
    });
  });

  describe('mode fork', function () {
    let applicationHandler: ApplicationHandler = null;
    before(async () => {
      applicationHandler = new ApplicationHandler({
        mode: 'fork',
        appName: 'test',
        entryFile: pathSimpleForkApp,
        appDir: dirname(pathSimpleForkApp)
      });
    });

    it('should start be ok', async () => {
      await applicationHandler.start();
      expect(applicationHandler.state).equal(State.complete);
      expect(applicationHandler.appId).to.be.ok;
      expect(applicationHandler.name).equal('test');
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('simple_fork');
    });

    it('should stop be ok', async () => {
      await applicationHandler.stop();
      expect(applicationHandler.state).equal(State.stopped);
      expect(applicationHandler.appId).to.equal(null);
    });
  });

});

