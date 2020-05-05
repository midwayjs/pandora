import {componentName, dependencies} from 'pandora-component-decorator';
import {EndPointManager} from 'pandora-component-actuator-server';
import {IndicatorManager} from 'pandora-component-indicator';
import { metrics } from '@opentelemetry/api'
import { MeterProvider } from '@opentelemetry/metrics'
import createDebug from 'debug'

import {MetricsEndPoint} from './MetricsEndPoint';
import {MetricsIndicator} from './MetricsIndicator';
import {MetricsForwarder} from './MetricsForwarder';
import { PandoraBatcher } from './Batcher'

const debug = createDebug('pandora:metrics')

@componentName('metrics')
@dependencies(['actuatorServer', 'indicator'])
export default class ComponentMetrics {
  ctx: any;
  metricsIndicator: MetricsIndicator;

  meterProvider: MeterProvider
  metricsForwarder: MetricsForwarder
  batcher: PandoraBatcher

  constructor(ctx) {
    this.ctx = ctx;

    this.batcher = new PandoraBatcher()
    this.metricsForwarder = new MetricsForwarder()
    this.meterProvider = new MeterProvider({ exporter: this.metricsForwarder, batcher: this.batcher, interval: 1000 })
    metrics.setGlobalMeterProvider(this.meterProvider)
    ctx.meterProvider = this.meterProvider
    ctx.metricsForwarder = this.metricsForwarder
    ctx.metricsBatcher = this.batcher

    const indicatorManager: IndicatorManager = ctx.indicatorManager;
    this.metricsIndicator = new MetricsIndicator(this.batcher);
    indicatorManager.register(this.metricsIndicator);
  }

  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new MetricsEndPoint(this.ctx));
  }
}

export * from './MetricsEndPoint';
export * from './MetricsIndicator';
