import { componentName, dependencies, componentConfig } from 'pandora-component-decorator';
import { NodeTracerProvider } from '@opentelemetry/node'
import { BasicTracerProvider } from '@opentelemetry/tracing'
import { MultiSpanProcessor } from './SpanProcessor'

@componentName('trace')
@dependencies(['indicator'])
@componentConfig({
  trace: {
    poolSize: 100,
    interval: 15 * 1000,
    slowThreshold: 10 * 1000,
    plugins: {}
  }
})
export default class ComponentTrace {
  ctx: any;
  spanProcessor: MultiSpanProcessor
  tracerProvider: BasicTracerProvider

  constructor(ctx: any) {
    this.ctx = ctx;
    this.spanProcessor = new MultiSpanProcessor()
    ctx.spanProcessor = this.spanProcessor
  }

  initTracer() {
    const tracer = this.tracerProvider.getTracer('pandora')
    return tracer
  }

  async startAtSupervisor() {
    await this.start()
  }

  async start() {
    // TODO: customize trace provider
    const tracerProvider = /** instruments applied */ new NodeTracerProvider({
      plugins: this.ctx.config.trace.plugins
    })
    tracerProvider.addSpanProcessor(this.spanProcessor)

    tracerProvider.register({})
    this.tracerProvider = tracerProvider
  }

  async stopAtSupervisor() {
    await this.stop()
  }

  async stop() {}

}

export * from './types';
export * from './TraceEndPoint';
