import {componentName, dependencies} from 'pandora-component-decorator';
import {ErrorLogManager} from './ErrorLogManager';

@componentName('errorLog')
@dependencies(['indicator'])
export default class ComponentErrorLog {
  errorLogManager: ErrorLogManager;
  constructor(ctx) {
    this.errorLogManager = new ErrorLogManager({});
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
