import {expect} from 'chai';
import {ComponentReflector} from 'pandora-component-decorator';
import ComponentActuatorServer from '../src/ComponentActuatorServer';
import {EndPointManager} from '../src/EndPointManager';
import {ActuatorRestServer} from '../src/ActuatorRestServer';

describe('ComponentActuatorServer', function () {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(ComponentActuatorServer)).to.be.equal('actuatorServer');
    expect(ComponentReflector.getComponentConfig<any>(ComponentActuatorServer).actuatorServer.http).to.be.ok;
  });

  it('should startAtSupervisor() / stopAtSupervisor() be ok', async () => {
    const ctx: any = {
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
    const componentActuatorServer: ComponentActuatorServer = new ComponentActuatorServer(ctx);
    await componentActuatorServer.startAtSupervisor();
    expect(componentActuatorServer.actuatorRestServer).to.be.an.instanceof(ActuatorRestServer);
    expect(ctx.endPointManager).to.be.an.instanceof(EndPointManager);
    const {address, port} = componentActuatorServer.actuatorRestServer.server.address();
    expect(address).to.be.contains(ctx.config.actuatorServer.http.host);
    expect(port).to.be.equal(ctx.config.actuatorServer.http.port);
    await componentActuatorServer.stopAtSupervisor();
    expect(componentActuatorServer.actuatorRestServer.server == null).to.be.ok;
  });

  it('should startAtSupervisor() / stopAtSupervisor() with http disable be ok', async () => {
    const ctx: any = {
      config: {
        actuatorServer: {
          http: {
            enabled: false,
            host: '127.0.0.1',
            port: 7002
          }
        }
      }
    };
    const componentActuatorServer: ComponentActuatorServer = new ComponentActuatorServer(ctx);
    await componentActuatorServer.startAtSupervisor();
    expect(componentActuatorServer.actuatorRestServer).to.be.an.instanceof(ActuatorRestServer);
    expect(ctx.endPointManager).to.be.an.instanceof(EndPointManager);
    expect(componentActuatorServer.actuatorRestServer.server == null).to.be.ok;
  });

});
