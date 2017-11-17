import {
  ProcessIndicator,
  ErrorIndicator,
  MetricsClient,
  MetricName,
  MetricsConstants,
  V8GaugeSet,
  MessengerSender,
  TraceIndicator,
  IPatcher
} from 'pandora-metrics';
import {DefaultLoggerManager} from 'pandora-service-logger';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {EnvironmentUtil} from 'pandora-env';
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
