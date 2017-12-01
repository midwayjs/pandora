'use strict';
import {DefaultLoggerManager, ILogger} from 'pandora-service-logger';
import {join} from 'path';
import {EOL} from 'os';

const ConsoleLogger = require('egg-logger').EggConsoleLogger;
export const consoleLogger = new ConsoleLogger({
  level: 'INFO',
});

let daemonLogger = null;

export function getPandoraLogsDir() {
  const {logger: loggerConfig} = lazyGetGlobalConfig();
  return loggerConfig.logsDir;
}

export function getDaemonLogger(): ILogger {
  const {logger: loggerConfig} = lazyGetGlobalConfig();
  if (!daemonLogger) {
    const loggerManager = DefaultLoggerManager.getInstance();
    daemonLogger = loggerManager.createLogger('daemon', {
      ...loggerConfig.daemonLogger,
      dir: join(loggerConfig.logsDir, 'pandorajs')
    });
  }
  return daemonLogger;
}

export function getDaemonStdoutLogPath() {
  const {logger: loggerConfig} = lazyGetGlobalConfig();
  return join(loggerConfig.logsDir, 'pandorajs/daemon_std.log');
}

export function getDaemonLogPath() {
  const {logger: loggerConfig} = lazyGetGlobalConfig();
  return join(loggerConfig.logsDir, 'pandorajs/daemon.log');
}

export function createAppLogger(appName, logName) {
  const {logger: loggerConfig} = lazyGetGlobalConfig();
  const loggerManager = DefaultLoggerManager.getInstance();
  return loggerManager.createLogger(logName, {
    ...loggerConfig.appLogger,
    dir: join(loggerConfig.logsDir, appName)
  });
}

export function getAppLogDir(appName) {
  const {logger: loggerConfig} = lazyGetGlobalConfig();
  return join(loggerConfig.logsDir, appName);
}

export function getAppLogPath(appName, logName) {
  return join(getAppLogDir(appName), logName + '.log');
}

const eolReg = new RegExp(EOL + '$');
export function removeEOL(str: string): string {
  eolReg.lastIndex = 0;
  return str.replace(eolReg, '');
}

/**
 * Prevent cycle dependencies
 * @return {any}
 */
function lazyGetGlobalConfig () {
  const globalConfigProcessor = require('./GlobalConfigProcessor').GlobalConfigProcessor.getInstance();
  return globalConfigProcessor.getAllProperties();
}
