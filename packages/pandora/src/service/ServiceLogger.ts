'use strict';
import {ILogger, DefaultLoggerManager} from 'pandora-service-logger';

/**
 * Class ServiceLogger
 */
export default class ServiceLogger implements ILogger {
  protected prefix: string;
  protected logger: ILogger;

  constructor(serviceCore) {
    const serviceId: string = serviceCore.getServiceId();
    this.prefix = `[appName: ${serviceCore.context.appName}, processName: ${serviceCore.context.processName}, workMode: ${serviceCore.workMode}] `;
    const defaultLoggerManager = DefaultLoggerManager.getInstance();
    this.logger = defaultLoggerManager.createLogger(serviceId, {
      stdoutLevel: 'NONE',
      level: 'INFO',
      type: 'date',
      dir: DefaultLoggerManager.getPandoraLogsDir()
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
