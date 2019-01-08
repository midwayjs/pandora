import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {MetricsOscillator} from './oscillator/MetricsOscillator';
import {TraceOscillator} from './oscillator/TraceOscillator';
import {ReporterManager} from './ReporterManager';

@componentName('reporterManager')
@dependencies(['metrics', 'trace', 'errorLog'])
@componentConfig({
  reporterManager: {
    reporterInterval: 60 // seconds
  }
})
export default class ComponentReporterManager {

  metricsOscillator: MetricsOscillator;
  traceOscillator: TraceOscillator;
  reporterManager: ReporterManager;
  ctx: any;

  constructor(ctx: any) {

    this.ctx = ctx;
    this.reporterManager = new ReporterManager;
    ctx.reporterManager = this.reporterManager;

    const {metricsManager, traceManager} = ctx;
    const config = this.ctx.config.reporterManager;
    this.metricsOscillator = new MetricsOscillator(metricsManager, {
      interval: config.reporterInterval
    });
    this.traceOscillator = new TraceOscillator(traceManager);

    this.bindOscillators();

  }

  bindOscillators() {
    this.metricsOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('metrics', data).catch(console.error);
    });
    this.traceOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('trace', data).catch(console.error);
    });
  }


  async start() {
    await this.metricsOscillator.start();
    await this.traceOscillator.start();
  }

  async startAtSupervisor() {
    await this.metricsOscillator.start();
    await this.traceOscillator.start();
  }

}

export * from './doamin';
export * from './ReporterManager';
export * from './oscillator/MetricsOscillator';
