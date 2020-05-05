import {componentName, dependencies} from 'pandora-component-decorator';
import {V8GaugeSet} from './node/V8GaugeSet';

@componentName('nodeMetrics')
@dependencies(['metrics'])
export default class ComponentNodeMetrics {

  ctx: any;
  v8Gauge: V8GaugeSet;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  async startAtSupervisor() {
    await this.startAtProcesses();
  }

  async start() {
    await this.startAtProcesses();
  }

  async startAtProcesses() {
    // TODO: api.metrics.getMeterProvider doesn't reflect correct global meterProvider
    this.v8Gauge = new V8GaugeSet(5000, this.ctx.meterProvider)
    this.v8Gauge.getMetrics()
  }

}

export * from './node/V8GaugeSet';
