import {
  ProcessIndicator,
  ErrorIndicator,
  MetricsClient,
  MetricName,
  MetricsConstants,
  V8GaugeSet,
  MessengerSender,
  TraceManager
} from 'pandora-metrics';
import {DefaultLoggerManager} from 'pandora-service-logger';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {EnvironmentUtil} from 'pandora-env';

const hook = require('module-hook');
const shimmer = require('shimmer');
import {resolve} from 'path';
import {PANDORA_APPLICATION} from '../const';
import {ProcessRepresentation} from '../domain';

export class MonitorManager {

  static injectProcessMonitor() {

    const globalConfigProcessor = GlobalConfigProcessor.getInstance();
    const globalConfig = globalConfigProcessor.getAllProperties();
    const hooks = globalConfig['hooks'];

    // init environment
    if (!EnvironmentUtil.getInstance().isReady()) {

      // cast PANDORA_APPLICATION to type ProcessRepresentation, need processName
      let processRepresentation: ProcessRepresentation = <any> {};

      try {
        processRepresentation = JSON.parse(process.env[PANDORA_APPLICATION]);
      } catch (err) {
        // ignore
      }

      EnvironmentUtil.getInstance().setCurrentEnvironment(new globalConfig['environment']({
        appDir: processRepresentation.appDir,
        appName: processRepresentation.appName,
        processName: processRepresentation.processName
      }));
    }

    // inject patch

    let sender = new MessengerSender();
    /**
     * hooks: {
     *   logger: Hooks.logger
     * }
     */
    for (const hookName in hooks) {
      if (hooks[hookName] && hooks[hookName].enabled) {
        try {
          let module = hooks[hookName].target;
          const m = typeof module === 'string' ? require(resolve(module)) : module;
          if(hooks[hookName]['initConfig']) {
            m(hooks[hookName]['initConfig'])({hook, shimmer, tracer: new TraceManager(), sender});
          } else {
            m({hook, shimmer, tracer: new TraceManager(), sender});
          }
          console.log(`${hookName} hook enabled`);
        } catch (err) {
          console.log(err);
          console.log(`enable ${hookName} hook went wrong`);
        }
      } else {
        console.log(`${hookName} hook disabled`);
      }
    }

    // init indicators
    const loggerManager = DefaultLoggerManager.getInstance();
    [
      new ProcessIndicator(),
      new ErrorIndicator(loggerManager),
    ].forEach((ins) => {
      ins.initialize();
    });

    // init metrics
    let client = MetricsClient.getInstance();
    global[MetricsConstants.GLOBAL_METRICS_KEY] = client;
    client.register('node', MetricName.build('node.v8').tagged({
      pid: process.pid
    }), new V8GaugeSet());
  }


}
