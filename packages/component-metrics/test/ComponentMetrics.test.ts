import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import {expect} from 'chai';
import ComponentMetrics from '../src/ComponentMetrics';
import ComponentIPCHub from 'pandora-component-ipc-hub';
import ComponentIndicator from 'pandora-component-indicator';
import ComponentActuatorServer from 'pandora-component-actuator-server';
import {MetricsManager} from '../src/MetricsManager';
import request = require('supertest');

describe('ComponentMetrics', () => {

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
  let componentMetrics: ComponentMetrics;

  before(async () => {

    componentActuatorServer = new ComponentActuatorServer(ctx);
    componentIPCHub = new ComponentIPCHub(ctx);
    componentIndicator = new ComponentIndicator(ctx);
    componentMetrics = new ComponentMetrics(ctx);

    await componentActuatorServer.startAtSupervisor();
    await componentIPCHub.startAtSupervisor();
    await componentIndicator.startAtSupervisor();
    await componentMetrics.startAtSupervisor();

  });

  after(async () => {

    await componentIPCHub.stopAtSupervisor();
    await componentActuatorServer.stopAtSupervisor();

  });

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentMetrics)).to.be.equal('metrics');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentMetrics)).to.deep.equal(['actuatorServer', 'indicator']);
  });

  it('should start be ok', async () => {
    expect(componentMetrics.metricsManager).be.an.instanceof(MetricsManager);
    expect(ctx.metricsManager).be.an.instanceof(MetricsManager);
  });

  it('should get metrics data from restful API be ok', async () => {
    ctx.metricsManager.getCounter('test', 'counter').inc();
    const server = componentActuatorServer.actuatorRestServer.server;
    const res = await request(server).get('/metrics/test').expect(200);
    expect(res.body.data[0].data[0].value).to.be.equal(1);
  });

});
