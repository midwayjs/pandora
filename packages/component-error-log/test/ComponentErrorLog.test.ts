import {expect} from 'chai';
import ComponentIPCHub from 'pandora-component-ipc-hub';
import ComponentIndicator from 'pandora-component-indicator';
import ComponentActuatorServer from 'pandora-component-actuator-server';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentErrorLog from '../src/ComponentErrorLog';
import request = require('supertest');
import {ErrorLogManager} from '../src/ErrorLogManager';

describe('ComponentErrorLog', function () {

  const ctx: any = {
    mode: 'supervisor',
    logger: console,
    config: {
      errorLog: {
        poolSize: 100
      },
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
  let componentErrorLog: ComponentErrorLog;

  before(async () => {

    componentActuatorServer = new ComponentActuatorServer(ctx);
    componentIPCHub = new ComponentIPCHub(ctx);
    componentIndicator = new ComponentIndicator(ctx);
    componentErrorLog = new ComponentErrorLog(ctx);

    await componentActuatorServer.startAtSupervisor();
    await componentIPCHub.startAtSupervisor();
    await componentIndicator.startAtSupervisor();
    await componentErrorLog.startAtSupervisor();

  });

  after(async () => {

    await componentIPCHub.stopAtSupervisor();
    await componentActuatorServer.stopAtSupervisor();

  });


  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentErrorLog)).to.be.equal('errorLog');
    expect(ComponentReflector.getComponentConfig<any>(<IComponentConstructor> ComponentErrorLog).errorLog.poolSize).to.be.ok;
  });


  it('should pass errorLog from errorLogManager to recent window be ok', async () => {
    const server = componentActuatorServer.actuatorRestServer.server;
    const errorLogManager: ErrorLogManager = ctx.errorLogManager;
    errorLogManager.record({
      timestamp: Date.now()
    });
    const res = await request(server).get('/error').expect(200);
    expect(res.body.data[0].data.length).to.be.equal(1);
  });


});
