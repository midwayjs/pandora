import {componentName} from 'pandora-component-decorator';
import {EndPointManager} from './EndPointManager';

@componentName('actuatorServer')
export default class ComponentActuatorServer {
  ctx: any;
  endPointManager: EndPointManager = new EndPointManager;
  constructor(ctx) {
    ctx.endPointManager = this.endPointManager;
    this.ctx = ctx;
  }
  async startAtSupervisor() {
    console.log('>>>>>>> Start Actuator Server at Supervisor');
  }
}