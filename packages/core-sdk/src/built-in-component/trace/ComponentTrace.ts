import { componentName, dependencies } from 'pandora-component-decorator';
import { TraceManager } from './TraceManager';
import { TraceManagerOptions } from './domain';

@componentName('trace')
@dependencies(['indicator'])
export default class ComponentTrace {
  ctx: any;
  traceManager: TraceManager;

  constructor(ctx: any, options?: TraceManagerOptions) {
    this.ctx = ctx;
    this.traceManager = new TraceManager(options);
    ctx.traceManager = this.traceManager;
  }

  async start() {
    await this.traceManager.start();
  }

  async stop() {
    await this.traceManager.stop();
  }
}