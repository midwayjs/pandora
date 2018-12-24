import {MetricName, MetricLevel, MetricsCollectPeriodConfig, MetricsManager} from 'metrics-common';
import {componentName, dependencies} from 'pandora-component-decorator';
import {V8GaugeSet} from './node/V8GaugeSet';

@componentName('nodeMetrics')
@dependencies(['metrics'])
export default class ComponentNodeMetrics {

  ctx: any;
  metricsCollectPeriodConfig = MetricsCollectPeriodConfig.getInstance();
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

    const metricsManager: MetricsManager = this.ctx.metricsManager;

    metricsManager.register('node', MetricName.build('node.v8'),
      new V8GaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

  }

}

export * from './node/V8GaugeSet';
export * from './util/CachedMetricSet';
export * from './util/Mutex';
