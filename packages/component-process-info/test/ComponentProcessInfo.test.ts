import {ComponentReflector, IComponentConstructor} from '@pandorajs/component-decorator';
import {expect} from 'chai';
import ComponentProcessInfo from '../src/ComponentProcessInfo';
import ComponentIPCHub from '@pandorajs/component-ipc-hub';
import ComponentIndicator from '@pandorajs/component-indicator';
import ComponentActuatorServer from '@pandorajs/component-actuator-server';
import {ProcessInfoIndicator} from '../src/ProcessIndicator';
import request = require('supertest');

describe('ComponentProcessInfo', () => {

  const ctx: any = {
    mode: 'supervisor',
    config: {
      actuatorServer: {
        http: {
          enabled: true,
          host: '127.0.0.1',
          port: 7002
        }
      }
    }
  };

  let componentActuatorServer: ComponentActuatorServer;
  let componentIPCHub: ComponentIPCHub;
  let componentIndicator: ComponentIndicator;
  let componentProcessInfo: ComponentProcessInfo;

  before(async () => {

    componentActuatorServer = new ComponentActuatorServer(ctx);
    componentIPCHub = new ComponentIPCHub(ctx);
    componentIndicator = new ComponentIndicator(ctx);
    componentProcessInfo = new ComponentProcessInfo(ctx);

    await componentActuatorServer.startAtSupervisor();
    await componentIPCHub.startAtSupervisor();
    await componentIndicator.startAtSupervisor();
    await componentProcessInfo.startAtSupervisor();

  });

  after(async () => {

    await componentIPCHub.stopAtSupervisor();
    await componentActuatorServer.stopAtSupervisor();

  });

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentProcessInfo)).to.be.equal('processInfo');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentProcessInfo)).to.deep.equal(['actuatorServer', 'indicator']);
  });

  it('should start be ok', async () => {
    expect(ctx.indicatorManager.get('process')[0]).be.an.instanceof(ProcessInfoIndicator);
  });

  it('should get metrics data from restful API be ok', async () => {
    const server = componentActuatorServer.actuatorRestServer.server;
    const res = await request(server).get('/process/').expect(200);
    expect(res.body.data[0].pid).to.be.ok;
    expect(res.body.data[0].title).to.be.ok;
    expect(res.body.data[0].argv).to.be.ok;
    expect(res.body.data[0].execArgv).to.be.ok;
    expect(res.body.data[0].execPath).to.be.ok;
    expect(res.body.data[0].uptime).to.be.ok;
  });

});
