import {ApplicationHandler} from '../../src/application/ApplicationHandler';
import {expect} from 'chai';
import mm = require('mm');
import {State} from '../../src/const';

describe('ApplicationHandler', function () {

  describe('basic', () => {

    it('should get name and appDir be ok', () => {

      const ah = new ApplicationHandler({
        appName: 'testApp',
        appDir: 'testDir'
      });

      expect(ah.appName).to.be.equal('testApp');
      expect(ah.appDir).to.be.equal('testDir');
      expect(ah.pids).to.be.deep.equal([]);
      expect(ah.uptime).to.be.deep.equal(0);

    });

  });

  describe('start and stop', () => {

    const rp = {appName: 'testApp', appDir: __dirname};

    afterEach(() => {
      mm.restore();
    });

    it('should fillMounted() be ok', async () => {

      const ah = new ApplicationHandler(rp);

      mm(ah, 'getStructure', () => {
        return {
          process: [
            {...rp, processName: 'testProcess1'},
            {...rp, processName: 'testProcess2'}
          ]
        };
      });

      await ah.fillMounted();
      const once = ah.mountedProcesses;
      await ah.fillMounted();
      const twice = ah.mountedProcesses;

      expect(once).to.be.equal(twice);
      expect(once.length).to.be.equal(2);

      expect(once[0].processName).to.be.equal('testProcess1');
      expect(once[1].processName).to.be.equal('testProcess2');

    });

    it('should got a error when appDir not exists', async () => {
      const dir = '/dsf/sdf/dsf/ds/fds/';
      const ah = new ApplicationHandler({appName: 'testApp', appDir: dir});
      await expect(ah.start()).rejectedWith(`AppDir ${dir} does not exist`);
    });

    it('should got a error when mountedProcesses.length eq 0', async () => {
      const ah = new ApplicationHandler(rp);
      mm(ah, 'fillMounted', () => {
        ah.mountedProcesses = [];
      });
      await expect(ah.start()).rejectedWith('Start failed, looks like not a pandora project, in appDir ' + rp.appDir);
    });

    it('should start be ok', async () => {

      const ah = new ApplicationHandler(rp);

      let startTimes = 0;
      mm(ah, 'fillMounted', () => {
        ah.mountedProcesses = <any> [
          { start: () => { startTimes++; }, pid: 3, startCount: 1 },
          { start: () => { startTimes++; }, pid: 4, startCount: 1 }
        ];
      });

      await ah.start();
      expect(startTimes).to.be.equal(2);
      expect(ah.pids).to.be.deep.equal([3, 4]);
      expect(ah.uptime).to.be.a('number');
      expect(ah.startCount).to.be.equal(2);
      expect(ah.restartCount).to.be.equal(0);

    });

    it('should start fail back to stop be ok', async () => {

      const ah = new ApplicationHandler(rp);

      let startTimes = 0;
      let stopTimes = 0;
      mm(ah, 'fillMounted', () => {
        ah.mountedProcesses = <any> [
          { start: () => { startTimes++; }, stop: () => { stopTimes++; } },
          { start: () => { startTimes++; }, stop: () => { stopTimes++; } },
          { start: () => { startTimes++; }, stop: () => { stopTimes++; } },
          { start: () => { throw new Error('fake start error'); }, stop: () => { stopTimes++; } },
          { start: () => { startTimes++; }, stop: () => { stopTimes++; } },
          { start: () => { startTimes++; }, stop: () => { stopTimes++; } },
        ];
      });

      await expect(ah.start()).rejectedWith('fake start error');

      expect(startTimes).to.be.equal(3);
      expect(stopTimes).to.be.equal(3);

    });

    it('should stop be ok', async () => {

      const ah = new ApplicationHandler(rp);

      let stopTimes = 0;
      mm(ah, 'mountedProcesses', [
        { stop: () => { stopTimes++; } },
        { stop: () => { stopTimes++; } }
      ]);

      mm(ah, 'state', State.complete);
      await ah.stop();
      await ah.stop();

      expect(stopTimes).to.be.equal(2);

    });

    it('should reload be ok', async () => {

      const ah = new ApplicationHandler(rp);

      let reloadTimes = 0;
      mm(ah, 'mountedProcesses', [
        { reload: () => { reloadTimes++; } },
        { reload: () => { reloadTimes++; } }
      ]);

      await ah.reload('n');

      expect(reloadTimes).to.be.equal(2);

    });

  });

});
