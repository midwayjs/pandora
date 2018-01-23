'use strict';
import {getDaemonLogger} from '../universal/LoggerBroker';
import {ILogger, LoggerRotator} from 'pandora-service-logger';
import {
  CpuUsageGaugeSet,
  NetTrafficGaugeSet,
  SystemMemoryGaugeSet,
  SystemLoadGaugeSet,
  DiskStatGaugeSet,
  MetricsActuatorServer,
  MetricLevel,
  MetricsCollectPeriodConfig,
  MetricName,
  NetworkTrafficGaugeSet
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
  protected metricsCollectPeriodConfig = MetricsCollectPeriodConfig.getInstance();

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

    // set global reporter interval
    this.metricsCollectPeriodConfig.configGlobalPeriod(this.globalConfig['reporterInterval']);

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
    metricsManager.register('system', MetricName.build('system').setLevel(MetricLevel.MAJOR), new CpuUsageGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.MAJOR)));
    metricsManager.register('system', MetricName.build('system').setLevel(MetricLevel.TRIVIAL), new NetTrafficGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.TRIVIAL)));
    metricsManager.register('system', MetricName.build('system').setLevel(MetricLevel.TRIVIAL), new NetworkTrafficGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.TRIVIAL)));
    metricsManager.register('system', MetricName.build('system').setLevel(MetricLevel.TRIVIAL), new SystemMemoryGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.TRIVIAL)));
    metricsManager.register('system', MetricName.build('system').setLevel(MetricLevel.MAJOR), new SystemLoadGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.MAJOR)));
    metricsManager.register('system', MetricName.build('system').setLevel(MetricLevel.TRIVIAL), new DiskStatGaugeSet(this.metricsCollectPeriodConfig.getCachedTimeForLevel(MetricLevel.TRIVIAL)));
  }

  protected startMetricsReporter() {
    debug('start a metrics reporter');
    for (let reporterName in this.globalConfig['reporter']) {
      const reporterObj = this.globalConfig['reporter'][reporterName];
      if (reporterObj['enabled']) {
        let reporterIns = new reporterObj['target'](this.server, reporterObj.initConfig || {});
        reporterIns.start(this.globalConfig['reporterInterval']);
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

