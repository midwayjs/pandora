'use strict';
import {ILogger, DefaultLoggerManager} from 'pandora-service-logger';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {getAppLogDir} from '../universal/LoggerBroker';

/**
 * Class ServiceLogger
 */
export default class ServiceLogger implements ILogger {
  protected prefix: string;
  protected logger: ILogger;

  constructor(serviceCore) {
    this.prefix = `[serviceName: ${serviceCore.getServiceId()}, processName: ${serviceCore.context.processName}] `;
    this.setupLogger(serviceCore);
  }

  static commonServiceLogger: ILogger;

  setupLogger (serviceCore) {

    const serviceId: string = serviceCore.getServiceId();
    const globalConfig = GlobalConfigProcessor.getInstance().getAllProperties();
    const defaultLoggerManager = DefaultLoggerManager.getInstance();

    if(!globalConfig.logger.isolatedServiceLogger && !ServiceLogger.commonServiceLogger) {
      ServiceLogger.commonServiceLogger = defaultLoggerManager.createLogger('service', {
        stdoutLevel: 'NONE',
        level: 'INFO',
        type: 'date',
        ...globalConfig.logger.serviceLogger,
        dir: getAppLogDir(serviceCore.context.appName)
      });
    }

    if(ServiceLogger.commonServiceLogger) {
      this.logger = ServiceLogger.commonServiceLogger;
      return;
    }

    this.logger = defaultLoggerManager.createLogger(serviceId, {
      stdoutLevel: 'NONE',
      level: 'INFO',
      type: 'date',
      ...globalConfig.logger.serviceLogger,
      dir: getAppLogDir(serviceCore.context.appName)
    });

  }

  debug(...args) {
    args = this.doPrefix(args);
    this.logger.debug(...args);
  }

  warn(...args) {
    args = this.doPrefix(args);
    this.logger.warn(...args);
  }

  info(...args) {
    args = this.doPrefix(args);
    this.logger.info(...args);
  }

  error(...args) {
    args = this.doPrefix(args);
    this.logger.error(...args);
  }

  log(...args) {
    args = this.doPrefix(args);
    this.logger.info(...args);
  }

  write(...args) {
    this.logger.write(...args);
  }

  doPrefix(args) {
    if (typeof args[0] === 'string') {
      args[0] = this.prefix + args[0];
    }
    return args;
  }

}
