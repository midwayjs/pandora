import { componentName, dependencies, componentConfig } from 'pandora-component-decorator';
import { TraceManager } from './TraceManager';
import { TraceManagerOptions } from './domain';

@componentName('trace')
@dependencies(['indicator'])
@componentConfig({
  trace: {
    poolSize: 100,
    interval: 60 * 1000,
    slowThreshold: 10 * 1000
  }
})
export default class ComponentTrace {
  ctx: any;
  traceManager: TraceManager;

  constructor(ctx: any) {
    this.ctx = ctx;
    const options: TraceManagerOptions = {
      ...ctx.config.trace,
      logger: ctx.logger,
    };
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
