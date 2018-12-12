import {componentName, dependencies} from 'pandora-component-decorator';
import {EndPointManager} from '../actuator-server/EndPointManager';
import {MetricsEndPoint} from './MetricsEndPoint';

@componentName('metrics')
@dependencies(['actuatorServer', 'indicator'])
export default class ComponentMetrics {
  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }
  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new MetricsEndPoint);
  }
}

