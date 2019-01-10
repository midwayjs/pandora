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

  async startAtSupervisor() {
    this.traceManager.start();
  }

  async start() {
    this.traceManager.start();
  }

  async stopAtSupervisor() {
    this.traceManager.stop();
  }

  async stop() {
    this.traceManager.stop();
  }

}

export * from './constants';
export * from './domain';
export * from './TraceData';
export * from './TraceEndPoint';
export * from './TraceIndicator';
export * from './TraceManager';
