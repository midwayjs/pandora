import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {join} from 'path';
import {homedir} from 'os';
import {SandboxMetricsFileReporter} from './SandboxMetricsFileReporter';
import {SandboxTraceFileReporter} from './SandboxTraceFileReporter';
import {SandboxErrorLogFileReporter} from './SandboxErrorLogFileReporter';

@componentName('sandboxFileReporter')
@dependencies(['metrics', 'fileLoggerService'])
@componentConfig({
  sandboxFileReporter: {
    logsDir: join(homedir(), 'logs'),
    globalTags: {},
    metrics: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL'
    },
    trace: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL'
    },
    error: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL'
    },
  }
})
export default class ComponentSandboxFileReporter {

  ctx: any;
  metricsFileReporter: SandboxMetricsFileReporter
  traceFileReporter: SandboxTraceFileReporter
  errorLogFileReporter: SandboxErrorLogFileReporter

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
    this.metricsFileReporter = new SandboxMetricsFileReporter(this.ctx)
    this.traceFileReporter = new SandboxTraceFileReporter(this.ctx)
    this.errorLogFileReporter = new SandboxErrorLogFileReporter(this.ctx)

    this.ctx.metricsForwarder.on('data', (data) => this.metricsFileReporter.report(data))
    this.ctx.spanProcessor.addSpanProcessor(this.traceFileReporter);
  }
}
