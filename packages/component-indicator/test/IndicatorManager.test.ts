import {expect} from 'chai';
import ComponentIPCHub from '@pandorajs/component-ipc-hub';
import {IndicatorManager} from '../src/IndicatorManager';
import {IIndicator, IndicatorScope} from '../src/domain';
require('chai').use(require('chai-as-promised'));


describe('IndicatorManager', () => {

  const indicator1: IIndicator = {
    group: 'testGroup',
    key: 'testKey1',
    scope: IndicatorScope.PROCESS,
    async invoke(query: any) {
      return 'testContent_1_' + query.x;
    }
  };
  const indicator2: IIndicator = {
    group: 'testGroup',
    key: 'testKey2',
    scope: IndicatorScope.PROCESS,
    async invoke(query: any) {
      return 'testContent_2_' + query.x;
    }
  };
  const indicator3: IIndicator = {
    group: 'testGroup',
    key: 'testKey3',
    scope: IndicatorScope.APP,
    async invoke(query: any) {
      return 'testContent_3_' + query.x;
    }
  };

  describe('dispersed', () => {

    it('should register() and get() be ok', () => {
      const ctx = {};
      const indicatorManager = new IndicatorManager(ctx);
      indicatorManager.register(indicator1);
      indicatorManager.register(indicator2);
      const res = indicatorManager.get('testGroup');
      expect(res).to.deep.equal([indicator1, indicator2]);
    });

    it('should invokeRaw() with scope filter be ok', async () => {
      const ctx = {};
      const indicatorManager = new IndicatorManager(ctx);
      indicatorManager.register(indicator1);
      indicatorManager.register(indicator2);
      indicatorManager.register(indicator3);
      const res = await indicatorManager.invokeRaw('testGroup', {x: 'XFactor', key: 'testKey3'});
      expect(res.length).to.be.equal(1);
      expect(res[0]).to.deep.include({
        group: 'testGroup', key: 'testKey3', data: 'testContent_3_XFactor', scope: 'APP'
      });
    });

    it('should throw error be ok when invokeRaw() a group that have not indicators exists', async () => {
      const ctx = {};
      const indicatorManager = new IndicatorManager(ctx);
      indicatorManager.register(indicator1);
      indicatorManager.register(indicator2);
      indicatorManager.register(indicator3);
      await expect(indicatorManager.invokeRaw('testGroupbaba')).be.rejectedWith('No such indicators with group: testGroupbaba');
    });

    it('should invokeRaw() with key filter be ok', async () => {
      const ctx = {};
      const indicatorManager = new IndicatorManager(ctx);
      indicatorManager.register(indicator1);
      indicatorManager.register(indicator2);
      indicatorManager.register(indicator3);
      const res = await indicatorManager.invokeRaw('testGroup', {x: 'XFactor', scope: IndicatorScope.PROCESS});
      expect(res.length).to.be.equal(2);
      expect(res[0]).to.deep.include({
        group: 'testGroup', key: 'testKey1', data: 'testContent_1_XFactor', scope: 'PROCESS'
      });
      expect(res[1]).to.deep.include({
        group: 'testGroup', key: 'testKey2', data: 'testContent_2_XFactor', scope: 'PROCESS'
      });

    });

    it('should invoke() be ok', async () => {
      const ctx = {};
      const indicatorManager = new IndicatorManager(ctx);
      indicatorManager.register(indicator1);
      indicatorManager.register(indicator2);
      indicatorManager.register(indicator3);
      const res1 = await indicatorManager.invoke('testGroup', {x: 'XFactor'});
      expect(res1.length).to.be.equal(3);
      const res2 = await indicatorManager.invoke('testGroup');
      expect(res2.length).to.be.equal(3);
    });

  });

  describe('multi-process', () => {

    let componentIPCHubSupervisor: ComponentIPCHub;
    let indicatorManagerSupervisor: IndicatorManager;
    let componentIPCHubWorker: ComponentIPCHub;
    let indicatorManagerWorker: IndicatorManager;
    let ctxSupervisor: any;
    let ctxWorker: any;

    before(async () => {
      ctxSupervisor = {
        mode: 'supervisor',
        config: {}
      };
      componentIPCHubSupervisor = new ComponentIPCHub(ctxSupervisor);
      await componentIPCHubSupervisor.startAtSupervisor();
      indicatorManagerSupervisor = new IndicatorManager(ctxSupervisor);

      ctxWorker = {
        mode: 'worker',
        config: {}
      };
      componentIPCHubWorker = new ComponentIPCHub(ctxWorker);
      await componentIPCHubWorker.start();
      indicatorManagerWorker = new IndicatorManager(ctxWorker);
    });

    after(async () => {
      await componentIPCHubWorker.stop();
      await componentIPCHubSupervisor.stopAtSupervisor();
    });

    it('should publish() and register() be ok', async () => {
      await indicatorManagerSupervisor.publish();
      await indicatorManagerWorker.publish();
      indicatorManagerSupervisor.register(indicator1);
      indicatorManagerSupervisor.register(indicator2);
      indicatorManagerSupervisor.register(indicator3);
      indicatorManagerWorker.register(indicator1);
      indicatorManagerWorker.register(indicator2);
      indicatorManagerWorker.register(indicator3);
    });


    it('should invokeAllProcessesRaw()be ok', async () => {
      for(const manager of [indicatorManagerSupervisor, indicatorManagerWorker]) {
        const res = await manager.invokeAllProcessesRaw('testGroup');
        expect(res.length).to.be.equal(6);
        const resWithQuery = await manager.invokeAllProcessesRaw('testGroup', {key: 'testKey3'});
        expect(resWithQuery.length).to.be.equal(2);
      }
    });

    it('should invokeAllProcesses() be ok', async () => {
      const res1 = await indicatorManagerSupervisor.invokeAllProcesses('testGroup', {x: 'XFactor'});
      expect(res1.length).to.be.equal(5);
      const res2 = await indicatorManagerSupervisor.invokeAllProcesses('testGroup');
      expect(res2.length).to.be.equal(5);
    });

  });

});
