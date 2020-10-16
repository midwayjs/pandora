import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { BasicTracerProvider } from '@opentelemetry/tracing';
import { MultiSpanProcessor } from './SpanProcessor';
import * as api from '@opentelemetry/api';

@componentName('trace')
@dependencies(['indicator'])
@componentConfig({
  trace: {
    tracerProvider: undefined,
  },
})
export default class ComponentTrace {
  ctx: any;
  spanProcessor: MultiSpanProcessor;
  tracerProvider: BasicTracerProvider;

  constructor(ctx: any) {
    this.ctx = ctx;
    this.spanProcessor = new MultiSpanProcessor();
    ctx.spanProcessor = this.spanProcessor;

    let tracerProvider = this.ctx.config.trace.tracerProvider;
    if (tracerProvider == null) {
      tracerProvider = new BasicTracerProvider({
        resource: this.ctx.resource,
      });
      tracerProvider.register({});
    }
    tracerProvider.addSpanProcessor(this.spanProcessor);
    this.ctx.tracerProvider = this.tracerProvider = tracerProvider;
    api.trace.setGlobalTracerProvider(tracerProvider);
  }

  initTracer() {
    const tracer = this.tracerProvider.getTracer('pandora');
    return tracer;
  }

  async startAtSupervisor() {
    await this.start();
  }

  async start() {}

  async stopAtSupervisor() {
    await this.stop();
  }

  async stop() {}
}

export * from './types';
