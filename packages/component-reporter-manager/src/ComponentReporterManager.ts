import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {MetricsOscillator} from './oscillator/MetricsOscillator';
import {TraceOscillator} from './oscillator/TraceOscillator';
import {ReporterManager} from './ReporterManager';
import {ErrorLogOscillator} from './oscillator/ErrorLogOscillator';

@componentName('reporterManager')
@dependencies(['metrics', 'trace', 'errorLog'])
@componentConfig({
  metrics: {
    interval: 60 * 1000
  }
})
export default class ComponentReporterManager {

  metricsOscillator: MetricsOscillator;
  traceOscillator: TraceOscillator;
  reporterManager: ReporterManager;
  errorLogOscillator: ErrorLogOscillator;
  ctx: any;

  constructor(ctx: any) {

    this.ctx = ctx;
    this.reporterManager = new ReporterManager;
    ctx.reporterManager = this.reporterManager;

    const {metricsManager, traceManager, errorLogManager} = ctx;
    const metricsConfig = this.ctx.config.metrics;
    this.metricsOscillator = new MetricsOscillator(metricsManager, {
      interval: metricsConfig.interval / 1000
    });
    this.traceOscillator = new TraceOscillator(traceManager);
    this.errorLogOscillator = new ErrorLogOscillator(errorLogManager);

    this.bindOscillators();

  }

  bindOscillators() {
    this.metricsOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('metrics', data).catch(console.error);
    });
    this.traceOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('trace', data).catch(console.error);
    });
    this.errorLogOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('errorLog', data).catch(console.error);
    });
  }


  async start() {
    await this.metricsOscillator.start();
    await this.traceOscillator.start();
    await this.errorLogOscillator.start();
  }

  async startAtSupervisor() {
    await this.metricsOscillator.start();
    await this.traceOscillator.start();
    await this.errorLogOscillator.stop();
  }

}

export * from './doamin';
export * from './ReporterManager';
export * from './oscillator/MetricsOscillator';
