'use strict';
import {getDaemonLogger} from '../universal/LoggerBroker';
import {ILogger, LoggerRotator} from 'pandora-service-logger';
import {
  CpuUsageGaugeSet,
  NetTrafficGaugeSet,
  SystemMemoryGaugeSet,
  SystemLoadGaugeSet,
  NetworkTrafficGaugeSet,
  MetricsActuatorServer
} from 'pandora-metrics';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {Hub} from 'pandora-hub';

const debug = require('debug')('pandora:cluster:monitor');

/**
 * Class Monitor
 */
export class Monitor {
  private daemonLogger = getDaemonLogger();
  private globalConfigProcesser = GlobalConfigProcessor.getInstance();
  private globalConfig = this.globalConfigProcesser.getAllProperties();
  private ipcHub = new Hub();
  private server;

  /**
   * Start Monitor
   * @return {Promise<void>}
   */
  async start() {

    await this.ipcHub.start();

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

    // register some default metrics
    let metricsManager = this.server.getMetricsManager();
    metricsManager.register('system', 'system', new CpuUsageGaugeSet());
    metricsManager.register('system', 'system', new NetTrafficGaugeSet());
    metricsManager.register('system', 'system', new SystemMemoryGaugeSet());
    metricsManager.register('system', 'system', new SystemLoadGaugeSet());
    metricsManager.register('system', 'system', new NetworkTrafficGaugeSet());
    // metricsManager.register('system', 'system', new DiskStatGaugeSet());
    debug('start a metrics reporter');
    for (let reporterName in this.globalConfig['reporter']) {
      const reporterObj = this.globalConfig['reporter'][reporterName];
      if (reporterObj['enabled']) {
        let reporterIns = new reporterObj['target'](this.server, reporterObj.initConfig || {});
        reporterIns.start(reporterObj['interval']);
        this.daemonLogger.info(`${reporterName} reporter started`);
      }
    }
    this.daemonLogger.info('monitor started');

  }

  /**
   * @return {Promise<void>}
   */
  async stop() {
    await this.ipcHub.stop();
    await this.server.destroy();
  }

}

