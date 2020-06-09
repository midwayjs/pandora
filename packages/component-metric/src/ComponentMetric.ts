import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { EndPointManager } from '@pandorajs/component-actuator-server';
import { IndicatorManager } from '@pandorajs/component-indicator';
import { metrics } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/metrics';

import { MetricsEndPoint } from './MetricsEndPoint';
import { MetricsIndicator } from './MetricsIndicator';
import { MetricsForwarder } from './MetricsForwarder';
import { PandoraBatcher } from './Batcher';

@componentName('metric')
@componentConfig({
  metric: {
    interval: 5000,
  },
})
@dependencies(['actuatorServer', 'indicator'])
export default class ComponentMetric {
  ctx: any;
  metricsIndicator: MetricsIndicator;

  meterProvider: MeterProvider;
  metricsForwarder: MetricsForwarder;
  batcher: PandoraBatcher;

  constructor(ctx) {
    this.ctx = ctx;
    const interval = ctx.config.metric.interval;

    this.batcher = new PandoraBatcher();
    this.metricsForwarder = new MetricsForwarder();
    this.meterProvider = new MeterProvider({
      exporter: this.metricsForwarder,
      batcher: this.batcher,
      interval,
    });
    metrics.setGlobalMeterProvider(this.meterProvider);
    ctx.meterProvider = this.meterProvider;
    ctx.metricsForwarder = this.metricsForwarder;
    ctx.metricsBatcher = this.batcher;

    const indicatorManager: IndicatorManager = ctx.indicatorManager;
    this.metricsIndicator = new MetricsIndicator(this.batcher);
    indicatorManager.register(this.metricsIndicator);
  }

  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new MetricsEndPoint(this.ctx));
  }
}

export * from './types';
