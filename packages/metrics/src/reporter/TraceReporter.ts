import * as os from 'os';
import * as address from 'address';
import { CustomReporter } from './CustomReporter';
import { DefaultLoggerManager } from 'pandora-service-logger';
import {EnvironmentUtil, Environment} from 'pandora-env';
import {join} from 'path';

export class TraceReporter extends CustomReporter {

  host = os.hostname();
  ip = address.ip();
  vernier = {};
  logger;
  environment: Environment;

  constructor(actuatorManager, options?) {
    super(actuatorManager, options);
    this.environment = EnvironmentUtil.getInstance().getCurrentEnvironment();
    this.initFileAppender();
  }

  initFileAppender() {
    this.logger = DefaultLoggerManager.getInstance().createLogger('traces', {
      type: 'size',
      maxFiles: 200 * 1024 * 1024,
      dir: join(this.environment.get('pandoraLogsDir'), 'pandorajs'),
      stdoutLevel: 'NONE',
      level: 'ALL'
    });
  }

  async collectTraces(): Promise<any> {
    const infoEndPoint = this.endPointService.getEndPoint('info');
    const info = await infoEndPoint.invoke();
    const traceEndPoint = this.endPointService.getEndPoint('trace');
    const appNames = [];

    Object.keys(info).forEach((app) => {
      const item = info[app];

      item.forEach((it) => {
        if (it.key === 'application' && it.scope === 'APP') {
          appNames.push(it.data.appName);
        }
      });
    });

    const traces = await Promise.all(appNames.map(async (appName) => {
      try {
        const data = await traceEndPoint.invoke({
          appName,
          value: this.vernier[appName] || 0,
          order: 'DESC',
          by: 'timestamp'
        });

        if (data && data.length > 0) {
          this.vernier[appName] = data[0].date + 1000;
        }

        return data || [];
      } catch(err) {
        console.error(`[TraceReporter] collect [${appName}] traces failed. `, err);

        return [];
      }
    }));

    return traces.reduce((result: object[], trace) => {
      return result.concat(trace);
    }, []);
  }

  async report() {
    const traces = await this.collectTraces();

    try {
      traces.forEach((trace) => {
        trace.ip = this.ip;
        trace.hostname = this.host;
        this.logger.write(JSON.stringify(trace));
      });
    } catch(err) {
      console.error('[TraceReporter] write trace data failed. ', err);
    }
  }
}
