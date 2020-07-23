import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { join } from 'path';
import { homedir } from 'os';
import { MetricsFileReporter } from './MetricsFileReporter';
import { TracesFileReporter } from './TracesFileReporter';
import { ExceptionsFileReporter } from './ExceptionsFileReporter';

@componentName('reporterFile')
@dependencies(['fileLoggerService'])
@componentConfig({
  reporterFile: {
    logsDir: join(homedir(), 'logs'),
    globalTags: {},
    metrics: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL',
    },
    traces: {
      type: 'size',
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 2,
      stdoutLevel: 'NONE',
      level: 'ALL',
    },
    exceptions: {
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
  tracesFileReporter: TracesFileReporter;
  exceptionsFileReporter: ExceptionsFileReporter;

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
    this.tracesFileReporter = new TracesFileReporter(this.ctx);
    this.exceptionsFileReporter = new ExceptionsFileReporter(this.ctx);

    this.ctx.metricsForwarder?.addMetricsExporter(this.metricsFileReporter);
    this.ctx.spanProcessor?.addSpanExporter(this.tracesFileReporter);
    this.ctx.logProcessor?.addLogExporter(this.exceptionsFileReporter);
  }
}
