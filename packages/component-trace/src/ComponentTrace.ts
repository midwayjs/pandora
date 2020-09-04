import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { NodeTracerProvider } from '@opentelemetry/node';
import { BasicTracerProvider } from '@opentelemetry/tracing';
import { MultiSpanProcessor } from './SpanProcessor';

@componentName('trace')
@dependencies(['indicator'])
@componentConfig({
  trace: {
    plugins: {},
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
  }

  initTracer() {
    const tracer = this.tracerProvider.getTracer('pandora');
    return tracer;
  }

  async startAtSupervisor() {
    await this.start();
  }

  async start() {
    let tracerProvider = this.ctx.config.trace.tracerProvider;
    if (tracerProvider == null) {
      tracerProvider = /** instruments applied */ new NodeTracerProvider({
        plugins: this.ctx.config.trace.plugins,
        resource: this.ctx.resource,
      });
      tracerProvider.register({});
    }

    tracerProvider.addSpanProcessor(this.spanProcessor);
    this.ctx.tracerProvider = this.tracerProvider = tracerProvider;
  }

  async stopAtSupervisor() {
    await this.stop();
  }

  async stop() {}
}

export * from './types';
