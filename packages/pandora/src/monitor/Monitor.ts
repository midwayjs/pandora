'use strict';
import {getDaemonLogger} from '../universal/LoggerBroker';
import {ILogger, LoggerRotator} from 'pandora-service-logger';
import {
  CpuUsageGaugeSet,
  NetTrafficGaugeSet,
  SystemMemoryGaugeSet,
  SystemLoadGaugeSet,
  DiskStatGaugeSet,
  MetricsActuatorServer
} from 'pandora-metrics';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';

const debug = require('debug')('pandora:cluster:monitor');

/**
 * Class Monitor
 */
export class BaseMonitor {
  protected daemonLogger = getDaemonLogger();
  protected globalConfigProcesser = GlobalConfigProcessor.getInstance();
  protected globalConfig = this.globalConfigProcesser.getAllProperties();
  protected server;

  /**
   * Start Monitor
   * @return {Promise<void>}
   */
  async start() {

    // start logger rotator serivce
    debug('start a monitor logger rotator service');
    const loggerRotator = new LoggerRotator({
      logger: <ILogger> this.daemonLogger
    });
    await loggerRotator.startService();

    // start metrics server
    debug('start a metrics server');
    this.server = new MetricsActuatorServer({
      config: this.globalConfig['actuator'],
      logger: this.daemonLogger,
      metricsManager: new this.globalConfig['metricsManager']()
    });

    this.startMetrics();
    this.startMetricsReporter();

    this.daemonLogger.info('monitor started');

  }

  protected startMetrics() {
    // register some default metrics
    let metricsManager = this.server.getMetricsManager();
    metricsManager.register('system', 'system', new CpuUsageGaugeSet());
    metricsManager.register('system', 'system', new NetTrafficGaugeSet());
    metricsManager.register('system', 'system', new SystemMemoryGaugeSet());
    metricsManager.register('system', 'system', new SystemLoadGaugeSet());
    metricsManager.register('system', 'system', new DiskStatGaugeSet());
  }

  protected startMetricsReporter() {
    debug('start a metrics reporter');
    for (let reporterName in this.globalConfig['reporter']) {
      const reporterObj = this.globalConfig['reporter'][reporterName];
      if (reporterObj['enabled']) {
        let reporterIns = new reporterObj['target'](this.server, reporterObj.initConfig || {});
        reporterIns.start(reporterObj['interval']);
        this.daemonLogger.info(`${reporterName} reporter started`);
      }
    }
  }

  /**
   * @return {Promise<void>}
   */
  async stop() {
    await this.server.destroy();
  }

}

