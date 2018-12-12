import {componentName, componentConfig} from 'pandora-component-decorator';
import {EndPointManager} from './EndPointManager';
import {ActuatorRestServer} from './ActuatorRestServer';

@componentName('actuatorServer')
@componentConfig({
  actuatorServer: {
    http: {
      enabled: true,
      port: 7002
    }
  }
})
export default class ComponentActuatorServer {
  ctx: any;
  endPointManager: EndPointManager;
  actuatorRestServer: ActuatorRestServer;
  constructor(ctx) {
    this.ctx = ctx;
    this.actuatorRestServer = new ActuatorRestServer(ctx);
    ctx.endPointManager = new EndPointManager(this.actuatorRestServer);
  }
  async startAtSupervisor() {
    this.actuatorRestServer.start();
  }
}