const debug = require('debug')('pandora:metrics:service');
import actuatorConfig from './conf/default';
import {MetricsActuatorManager} from './MetricsActuatorManager';
import extend = require('extend');
import {ActuatorServer} from './domain';

export class MetricsActuatorServer implements ActuatorServer {

  logger;

  metricManager;

  actuatorManager;

  constructor(options: {
    logger
    metricsServer,
    config?,
  }) {
    this.logger = options.logger;

    debug('init metrics manager');

    // 初始化 metrics server
    // 理论上这个应该在 metricsEndPoint 里初始化，这里提前，因为 reporter 要用
    this.metricManager = options.metricsServer;
    this.metricManager.setLogger(this.logger);

    debug('init actuator manager');

    // 初始化 actuators
    this.actuatorManager = new MetricsActuatorManager({
      logger: this.logger,
      config: extend(actuatorConfig, options.config || {}),
    });
  }

  getMetricsManager() {
    return this.metricManager;
  }

  getEndPointService() {
    return this.actuatorManager.endPointService;
  }

  registerEndPoint(endPoint) {
    this.getEndPointService().register(endPoint);
  }

  stop() {
    this.metricManager.setEnabled(false);
  }

  restart() {
    this.metricManager.setEnabled(true);
  }

  destroy() {
    this.metricManager.destory();
    this.actuatorManager.destory();
  }

}
