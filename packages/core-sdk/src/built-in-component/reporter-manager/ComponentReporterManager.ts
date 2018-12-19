import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {MetricsOscillator} from './oscillator/MetricsOscillator';
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
  reporterManager: ReporterManager;
  ctx: any;

  constructor(ctx: any) {

    this.ctx = ctx;
    this.reporterManager = new ReporterManager;
    ctx.reporterManager = this.reporterManager;

    const {metricsManager} = ctx;
    const config = this.ctx.config.reporterManager;
    this.metricsOscillator = new MetricsOscillator(metricsManager, {
      interval: config.reporterInterval
    });

    this.bindOscillators();

  }

  bindOscillators() {
    this.metricsOscillator.on('oscillate', (data) => {
      this.reporterManager.dispatch('metrics', data).catch(console.error);
    });
  }


  async start() {
    await this.metricsOscillator.start();
  }

  async startAtSupervisor() {
    await this.metricsOscillator.start();
  }

}