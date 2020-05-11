import { HubServer, HubFacade } from '@pandorajs/hub';
import { expect } from 'chai';
import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import ComponentIPCHub from '../src/ComponentIPCHub';

describe('ComponentIPCHub', () => {
  it('should have correct meta info', () => {
    expect(
      ComponentReflector.getComponentName(
        ComponentIPCHub as IComponentConstructor
      )
    ).to.be.equal('ipcHub');
  });

  let componentIPCHubSupervisor: ComponentIPCHub;
  let componentIPCHubWorker: ComponentIPCHub;

  it('should start be ok', async () => {
    componentIPCHubSupervisor = new ComponentIPCHub({ mode: 'supervisor' });
    componentIPCHubWorker = new ComponentIPCHub({ mode: 'worker' });
    await componentIPCHubSupervisor.startAtSupervisor();
    await componentIPCHubWorker.start();
    expect(componentIPCHubSupervisor.hubServer).to.be.an.instanceof(HubServer);
    expect(componentIPCHubSupervisor.hubFacade).to.be.an.instanceof(HubFacade);
    expect(componentIPCHubWorker.hubFacade).to.be.an.instanceof(HubFacade);
    expect(componentIPCHubWorker.hubServer == null).to.be.ok;
    expect(componentIPCHubSupervisor.ctx.hubServer).to.be.an.instanceof(
      HubServer
    );
    expect(componentIPCHubSupervisor.ctx.hubFacade).to.be.an.instanceof(
      HubFacade
    );
    expect(componentIPCHubWorker.ctx.hubFacade).to.be.an.instanceof(HubFacade);
    expect(componentIPCHubWorker.ctx.hubServer == null).to.be.ok;
  });

  it('should stop be ok', async () => {
    await componentIPCHubWorker.stop();
    await componentIPCHubSupervisor.stopAtSupervisor();
  });

  it('should hubFacade.setup() be ok at startClient()', async () => {
    const componentIPCHub = new ComponentIPCHub({
      mode: 'worker',
      appName: 'testApp',
      processName: 'testProcess',
    });
    let gotSetup: any;
    componentIPCHub.hubFacade = {
      setup(opts) {
        gotSetup = opts;
      },
      start() {},
    } as any;
    await componentIPCHub.startClient();
    expect(gotSetup.location).to.deep.equal({
      appName: 'testApp',
      processName: 'testProcess',
      pid: process.pid.toString(),
    });
  });

  it('should avoid error at startClient() be ok', async () => {
    const componentIPCHub = new ComponentIPCHub({ mode: 'worker' });
    componentIPCHub.hubFacade = {
      setup() {},
      start() {
        throw new Error('test error');
      },
    } as any;
    await componentIPCHub.startClient();
  });
});
