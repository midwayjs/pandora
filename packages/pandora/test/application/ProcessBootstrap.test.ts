import {ProcessBootstrap} from '../../src/application/ProcessBootstrap';
import {expect} from 'chai';
import mm = require('mm');
import {SpawnWrapperUtils} from '../../src/application/SpawnWrapperUtils';

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
      let calledWrap = false;
      mm(SpawnWrapperUtils, 'wrap', () => {
        calledWrap = true;
      });
      await pb.start();
      expect(calledWrap).to.equal(true);
    });

    it('should stop as worker be ok', async () => {
      const pb = new ProcessBootstrap(rp);
      let callUnwrap = false;
      mm(SpawnWrapperUtils, 'unwrap', () => {
        callUnwrap = true;
      });
      await pb.stop();
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
      mm(pb, 'master', {
        start: () => {
          callStartAsMaster = true;
        }
      });
      await pb.start();
      expect(callStartAsMaster).to.equal(true);
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
