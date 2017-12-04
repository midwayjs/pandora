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
  IPatcher
} from 'pandora-metrics';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {EnvironmentUtil} from 'pandora-env';
import {PANDORA_APPLICATION} from '../const';
import {ProcessRepresentation} from '../domain';
import {getPandoraLogsDir} from '../universal/LoggerBroker';
import {getPandoraConsoleLogger} from 'pandora-dollar';
const debug = require('debug')('pandora:MonitorManager');
const pandoraConsoleLogger = getPandoraConsoleLogger();

export class MonitorManager {

  static injected: boolean = false;

  static injectProcessMonitor() {

    if(MonitorManager.injected) {
      return;
    }

    const globalConfigProcessor = GlobalConfigProcessor.getInstance();
    const globalConfig = globalConfigProcessor.getAllProperties();
    const hooks = globalConfig['hook'];

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
          pandoraConsoleLogger.log(`Patcher(${process.pid}): enable ${hookName} hook went wrong, ${err.message}`);
        }
      } else {
        pandoraConsoleLogger.log(`Patcher(${process.pid}): ${hookName} hook disabled`);
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
    }), new V8GaugeSet());

    MonitorManager.injected = true;

  }


}
