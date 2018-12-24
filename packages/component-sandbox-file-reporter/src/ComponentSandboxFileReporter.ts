import {ReporterManager} from 'pandora-component-reporter-manager';
import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {join} from 'path';
import {homedir} from 'os';
import {SandboxMetricsFileReporter} from './SandboxMetricsFileReporter';

@componentName('sandboxFileReporter')
@dependencies(['reporterManager', 'fileLoggerService'])
@componentConfig({
  sandboxFileReporter: {
    logsDir: join(homedir(), 'logs'),
    metrics: {
      type: 'size',
      maxFileSize: 200 * 1024 * 1024,
      stdoutLevel: 'NONE',
      level: 'ALL'
    }
  }
})
export default class ComponentSandboxFileReporter {

  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }

  async start() {
    this.startAtAllProcesses();
  }

  async startAtSupervisor() {
    this.startAtAllProcesses();
  }

  startAtAllProcesses() {
    const reporterManager: ReporterManager = this.ctx.reporterManager;
    reporterManager.register('sandboxMetricsFileReporter', new SandboxMetricsFileReporter(this.ctx));
  }

}