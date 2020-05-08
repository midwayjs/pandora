import { componentName, dependencies } from 'pandora-component-decorator';
import { IndicatorManager } from './IndicatorManager';
import { consoleLogger } from 'pandora-dollar';

@componentName('indicator')
@dependencies(['ipcHub'])
export default class ComponentIndicator {
  ctx: any;
  indicatorManager: IndicatorManager;
  constructor(ctx) {
    this.ctx = ctx;
    this.indicatorManager = new IndicatorManager(ctx);
    ctx.indicatorManager = this.indicatorManager;
  }
  async startAtSupervisor() {
    await this.publish();
  }
  async start() {
    await this.publish();
  }
  async publish() {
    try {
      await this.indicatorManager.publish();
      consoleLogger.info(
        'Indicator manager published on IPC hub at PID ' + process.pid
      );
    } catch (err) {
      consoleLogger.warn(
        'Indicator manager publish failed on IPC hub at PID ' +
          process.pid +
          ', ' +
          err
      );
    }
  }
}

export * from './types';
export * from './IndicatorManager';
export * from './IndicatorManagerProxy';
export * from './IndicatorUtil';
