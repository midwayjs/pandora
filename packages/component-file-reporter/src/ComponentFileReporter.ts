import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { join } from 'path';
import { homedir } from 'os';
import { MetricsFileReporter } from './MetricsFileReporter';
import { TraceFileReporter } from './TraceFileReporter';
import { LogFileReporter } from './LogFileReporter';

@componentName('fileReporter')
@dependencies(['fileLoggerService'])
@componentConfig({
  fileReporter: {
    logsDir: join(homedir(), 'logs'),
    globalTags: {},
    metrics: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL',
    },
    trace: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL',
    },
    error: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL',
    },
  },
})
export default class ComponentFileReporter {
  ctx: any;
  metricsFileReporter: MetricsFileReporter;
  traceFileReporter: TraceFileReporter;
  logFileReporter: LogFileReporter;

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
    this.metricsFileReporter = new MetricsFileReporter(this.ctx);
    this.traceFileReporter = new TraceFileReporter(this.ctx);
    this.logFileReporter = new LogFileReporter(this.ctx);

    this.ctx.metricsForwarder?.addMetricsExporter(this.metricsFileReporter);
    this.ctx.spanProcessor?.addSpanExporter(this.traceFileReporter);
    this.ctx.logProcessor?.addLogExporter(this.logFileReporter);
  }
}
