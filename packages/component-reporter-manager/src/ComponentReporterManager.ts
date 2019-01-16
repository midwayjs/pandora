import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {MetricsOscillator} from './oscillator/MetricsOscillator';
import {TraceOscillator} from './oscillator/TraceOscillator';
import {ReporterManager} from './ReporterManager';
import {ErrorLogOscillator} from './oscillator/ErrorLogOscillator';
import {consoleLogger} from 'pandora-dollar';

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
      interval: metricsConfig.interval
    });
    this.traceOscillator = new TraceOscillator(traceManager);
    this.errorLogOscillator = new ErrorLogOscillator(errorLogManager);

    this.bindOscillators();

  }

  bindOscillators() {
    this.metricsOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('metrics', data).catch(consoleLogger.error);
    });
    this.traceOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('trace', data).catch(consoleLogger.error);
    });
    this.errorLogOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('errorLog', data).catch(consoleLogger.error);
    });
  }

  startAtAllProcesses() {
    this.metricsOscillator.start();
    this.traceOscillator.start();
    this.errorLogOscillator.start();
  }

  stopAtAllProcesses() {
    this.metricsOscillator.stop();
    this.traceOscillator.stop();
    this.errorLogOscillator.stop();
  }

  async start() {
    this.startAtAllProcesses();
  }

  async startAtSupervisor() {
    this.startAtAllProcesses();
  }

  async stop() {
    this.stopAtAllProcesses();
  }

  async stopAtSupervisor() {
    this.stopAtAllProcesses();
  }

}

export * from './domain';
export * from './ReporterManager';
export * from './oscillator/MetricsOscillator';
