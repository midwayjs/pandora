import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { join } from 'path';
import { homedir } from 'os';
import { MetricsFileReporter } from './MetricsFileReporter';
import { TraceFileReporter } from './TraceFileReporter';
import { ErrorLogFileReporter } from './ErrorLogFileReporter';

@componentName('fileReporter')
@dependencies(['metrics', 'fileLoggerService'])
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
  errorLogFileReporter: ErrorLogFileReporter;

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
    this.errorLogFileReporter = new ErrorLogFileReporter(this.ctx);

    this.ctx.metricsForwarder.on('data', data =>
      this.metricsFileReporter.report(data)
    );
    this.ctx.spanProcessor.addSpanExporter(this.traceFileReporter);
  }
}
