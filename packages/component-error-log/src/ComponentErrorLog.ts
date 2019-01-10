import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {ErrorLogManager} from './ErrorLogManager';

@componentName('errorLog')
@dependencies(['indicator'])
@componentConfig({
  errorLog: {
    interval: 60 * 1000,
    poolSize: 100
  }
})
export default class ComponentErrorLog {
  errorLogManager: ErrorLogManager;
  constructor(ctx) {
    const errorLogConfig = ctx.config.errorLog;
    this.errorLogManager = new ErrorLogManager({
      interval: errorLogConfig.interval,
      poolSize: errorLogConfig.poolSize
    });
    ctx.errorLogManager = this.errorLogManager;
  }
  async start() {
    this.errorLogManager.start();
  }
  async stop() {
    this.errorLogManager.stop();
  }
}

export * from './ErrorLogManager';
export * from './domain';
