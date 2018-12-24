import {componentName, dependencies} from 'pandora-component-decorator';
import {EndPointManager} from 'pandora-component-actuator-server';
import {IndicatorManager} from 'pandora-component-indicator';
import {ProcessInfoIndicator} from './ProcessIndicator';
import {ProcessEndPoint} from './ProcessEndPoint';

@componentName('processInfo')
@dependencies(['indicator'])
export default class ComponentProcessInfo {

  ctx: any;
  processInfoIndicator: ProcessInfoIndicator;
  constructor(ctx: any) {
    this.ctx = ctx;

    const indicatorManager: IndicatorManager = ctx.indicatorManager;
    this.processInfoIndicator = new ProcessInfoIndicator(this.ctx);
    indicatorManager.register(this.processInfoIndicator);
  }

  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new ProcessEndPoint(this.ctx));
  }

}

export * from './ProcessIndicator';
export * from './ProcessEndPoint';
