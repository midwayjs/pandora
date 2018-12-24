import {MetricName, MetricLevel, MetricsCollectPeriodConfig, MetricsManager} from 'metrics-common';
import {componentName, dependencies} from 'pandora-component-decorator';
import {CpuUsageGaugeSet} from './os/CpuUsageGaugeSet';
import {NetTrafficGaugeSet} from './os/NetTrafficGaugeSet';
import {NetworkTrafficGaugeSet} from './os/TcpGaugeSet';
import {SystemMemoryGaugeSet} from './os/SystemMemoryGaugeSet';
import {SystemLoadGaugeSet} from './os/SystemLoadGaugeSet';
import {DiskStatGaugeSet} from './os/DiskStatGaugeSet';

@componentName('systemMetrics')
@dependencies(['metrics'])
export default class ComponentSystemMetrics {

  ctx: any;
  metricsCollectPeriodConfig = MetricsCollectPeriodConfig.getInstance();
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  async startAtSupervisor() {

    const metricsManager: MetricsManager = this.ctx.metricsManager;

    metricsManager.register('system', MetricName.build('system'),
      new CpuUsageGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

    metricsManager.register('system', MetricName.build('system'),
      new NetTrafficGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

    metricsManager.register('system', MetricName.build('system'),
      new NetworkTrafficGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

    metricsManager.register('system', MetricName.build('system'),
      new SystemMemoryGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

    metricsManager.register('system', MetricName.build('system'),
      new SystemLoadGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

    metricsManager.register('system', MetricName.build('system'),
      new DiskStatGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

  }
}

export * from './os/CpuUsageGaugeSet';
export * from './os/DiskStatGaugeSet';
export * from './os/NetTrafficGaugeSet';
export * from './os/SystemLoadGaugeSet';
export * from './os/SystemMemoryGaugeSet';
export * from './os/TcpGaugeSet';
export * from './util/CachedMetricSet';
export * from './util/Mutex';
