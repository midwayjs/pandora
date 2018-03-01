import {ProcessBootstrap} from '../../src/application/ProcessBootstrap';
import {expect} from 'chai';
import mm = require('mm');
import {SpawnWrapperUtils} from '../../src/application/SpawnWrapperUtils';
import {MonitorManager} from '../../src/monitor/MonitorManager';

describe('ProcessBootstrap', function () {


  describe('As Worker', () => {

    const rp = {
      appName: 'testApp',
      appDir: __dirname,
      processName: 'testProcess',
      scale: 1
    };

    afterEach(() => {
      mm.restore();
      SpawnWrapperUtils.unwrap();
    });

    it('should start as worker be ok', async () => {

      const pb = new ProcessBootstrap(rp);
      let callStart = false;
      let callBind = false;
      let calledInject = false;

      mm(pb, 'context', {
        start: () => {
          callStart = true;
        },
        bindService: () => {
          callBind = true;
        },
        getIPCHub: () => {
          return {
            start: () => {
            },
          };
        }
      });

      mm(MonitorManager, 'injectProcessMonitor', () => {
        calledInject = true;
      });

      mm(pb, 'procfileReconciler', {
        discover () {},
        getServicesByCategory(processName) {
          expect(processName).to.equal(rp.processName);
        }
      });

      await pb.start();

      expect(calledInject).to.equal(true);
      expect(callStart).to.equal(true);
      expect(callBind).to.equal(true);

    });

    it('should stop as worker be ok', async () => {

      const pb = new ProcessBootstrap(rp);
      let callStop = false;
      let callUnwrap = false;
      mm(pb, 'context', {
        stop: () => {
          callStop = true;
        }
      });

      mm(SpawnWrapperUtils, 'unwrap', () => {
        callUnwrap = true;
      });

      await pb.stop();

      expect(callStop).to.equal(true);
      expect(callUnwrap).to.equal(true);

    });

  });

  describe('As Master', () => {

    const rp = {
      appName: 'testApp',
      appDir: __dirname,
      processName: 'testProcess',
      scale: 2
    };

    afterEach(() => {
      mm.restore();
    });

    it('should start as master be ok', async () => {
      const pb = new ProcessBootstrap(rp);
      let callStartAsMaster = false;
      let calledInject = false;
      mm(pb, 'master', {
        start: () => {
          callStartAsMaster = true;
        }
      });
      mm(MonitorManager, 'injectProcessMonitor', () => {
        calledInject = true;
      });
      await pb.start();
      expect(callStartAsMaster).to.equal(true);
      expect(calledInject).to.equal(true);
    });

    it('should stop as master be ok', async () => {
      const pb = new ProcessBootstrap(rp);
      let callStopAsMaster = false;
      mm(pb, 'master', {
        stop: () => {
          callStopAsMaster = true;
        }
      });
      await pb.stop();
      expect(callStopAsMaster).to.equal(true);
    });

  });

});
