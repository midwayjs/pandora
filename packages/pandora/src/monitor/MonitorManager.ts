import {
  BaseInfoIndicator,
  NodeIndicator,
  ProcessIndicator,
  ErrorIndicator,
  MetricsClientUtil,
  MetricName,
  MetricsConstants,
  V8GaugeSet,
  TraceIndicator,
  IPatcher,
  MetricsCollectPeriodConfig,
  MetricLevel
} from 'pandora-metrics';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {EnvironmentUtil} from 'pandora-env';
import {PANDORA_PROCESS} from '../const';
import {ProcessRepresentation} from '../domain';
import {getPandoraLogsDir} from '../universal/LoggerBroker';
const debug = require('debug')('pandora:MonitorManager');

export class MonitorManager {

  static injected: boolean = false;

  static injectProcessMonitor() {

    // console.log('inject Monitor');

    if(MonitorManager.injected) {
      return;
    }

    const globalConfigProcessor = GlobalConfigProcessor.getInstance();
    const globalConfig = globalConfigProcessor.getAllProperties();
    const hooks = globalConfig['hook'];

    // set global reporter interval
    const periodConfig = MetricsCollectPeriodConfig.getInstance();
    periodConfig.configGlobalPeriod(globalConfig['reporterInterval']);

    // init environment
    if (!EnvironmentUtil.getInstance().isReady()) {

      // cast PANDORA_PROCESS to type ProcessRepresentation, need processName
      let processRepresentation: ProcessRepresentation = <any> {};

      try {
        processRepresentation = JSON.parse(process.env[PANDORA_PROCESS]);
      } catch (err) {
        // ignore
      }

      EnvironmentUtil.getInstance().setCurrentEnvironment(new globalConfig['environment']({
        appDir: processRepresentation.appDir,
        appName: processRepresentation.appName,
        processName: processRepresentation.processName,
        pandoraLogsDir: getPandoraLogsDir()
      }));
    }

    // init metrics client
    let ClientCls = globalConfig['metricsClient'];
    let client = ClientCls.getInstance();
    MetricsClientUtil.setMetricsClient(client);
    // support old version
    global[MetricsConstants.GLOBAL_METRICS_KEY] = client;

    // inject patch

    let traceIndicator = new TraceIndicator();
    traceIndicator.initialize();
    /**
     * hooks: {
     *   logger: Hooks.logger
     * }
     */
    for (const hookName in hooks) {
      if (hooks[hookName] && hooks[hookName].enabled) {
        try {
          let PatcherCls = hooks[hookName].target;
          let patcher: IPatcher = new PatcherCls(hooks[hookName]['initConfig']);
          patcher.run();
          debug(`Patcher(${process.pid}): ${hookName} hook enabled`);
        } catch (err) {
          debug(`Patcher(${process.pid}): enable ${hookName} hook went wrong, ${err.message}`);
        }
      } else {
        debug(`Patcher(${process.pid}): ${hookName} hook disabled`);
      }
    }

    // init indicators
    [
      new BaseInfoIndicator(),
      new NodeIndicator(),
      new ProcessIndicator(),
      new ErrorIndicator(),
    ].forEach((ins) => {
      ins.initialize();
    });

    // init metrics
    client.register('node', MetricName.build('node.v8').tagged({
      pid: process.pid
    }), new V8GaugeSet(periodConfig.getCachedTimeForLevel(MetricLevel.NORMAL)));

    MonitorManager.injected = true;

  }


}
