import {
  ProcessIndicator,
  ErrorIndicator,
  MetricsClient,
  MetricName,
  MetricsConstants,
  V8GaugeSet
} from 'pandora-metrics';
import {DefaultLoggerManager} from 'pandora-service-logger';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
const hook = require('module-hook');
const shimmer = require('shimmer');
import {resolve} from 'path';

export class MonitorManager {

  static injectProcessMonitor() {

    const globalConfigProcessor = GlobalConfigProcessor.getInstance();
    const globalConfig = globalConfigProcessor.getAllProperties();
    const hooks = globalConfig['hooks'];

    // inject patch

    /**
     * hooks: {
     *   logger: Hooks.logger
     * }
     */
    for(const hookName in hooks) {
      if(hooks[hookName]) {
        try {
          let module = hooks[hookName];
          const m = typeof module === 'string' ? require(resolve(module)) : module;
          m(hook, shimmer);
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
