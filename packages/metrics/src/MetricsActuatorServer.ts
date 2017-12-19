import {MetricsInjectionBridge} from './util/MetricsInjectionBridge';
const debug = require('debug')('pandora:metrics:service');
import actuatorConfig from './conf/default';
import {MetricsActuatorManager} from './MetricsActuatorManager';
import extend = require('extend');
import {ActuatorServer} from './domain';

export class MetricsActuatorServer implements ActuatorServer {

  logger;

  metricsManager;

  actuatorManager;

  constructor(options: {
    logger
    metricsManager,
    config?,
  }) {
    this.logger = options.logger;

    debug('init metrics manager');

    // 初始化 metrics server
    // 理论上这个应该在 metricsEndPoint 里初始化，这里提前，因为 reporter 要用
    this.metricsManager = options.metricsManager;
    this.metricsManager.setLogger(this.logger);
    // set metricsManager for some endPoint
    MetricsInjectionBridge.setMetricsManager(this.metricsManager);

    debug('init actuator manager');

    // 初始化 actuators
    this.actuatorManager = new MetricsActuatorManager({
      logger: this.logger,
      config: extend(true, {}, actuatorConfig, options.config || {}),
    });
  }

  getMetricsManager() {
    return this.metricsManager;
  }

  getEndPointService() {
    return this.actuatorManager.endPointService;
  }

  registerEndPoint(endPoint) {
    this.getEndPointService().register(endPoint);
  }

  stop() {
    this.metricsManager.setEnabled(false);
  }

  restart() {
    this.metricsManager.setEnabled(true);
  }

  destroy() {
    this.metricsManager.destory();
    this.actuatorManager.destory();
  }

}
