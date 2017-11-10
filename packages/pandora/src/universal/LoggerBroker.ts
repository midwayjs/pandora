'use strict';
import {DefaultLoggerManager, ILogger} from 'pandora-service-logger';
import {join} from 'path';
import {EOL} from 'os';

const ConsoleLogger = require('egg-logger').EggConsoleLogger;
export const consoleLogger = new ConsoleLogger({
  level: 'INFO',
});

let daemonLogger = null;

export function getDaemonLogger(): ILogger {
  if (!daemonLogger) {
    const loggerManager = DefaultLoggerManager.getInstance();
    daemonLogger = loggerManager.createLogger('daemon', {
      stdoutLevel: 'ERROR',
      level: 'INFO',
      dir: DefaultLoggerManager.getPandoraLogsDir()
    });
  }
  return daemonLogger;
}

export function getDaemonStdoutLoggerPath() {
  return join(DefaultLoggerManager.getPandoraLogsDir(), 'daemon_std.log');
}

// TODO: move those logger config into globalConfig
export function createAppLogger(appName, logName) {
  const loggerManager = DefaultLoggerManager.getInstance();
  return loggerManager.createLogger(logName, {
    stdoutLevel: 'NONE',
    level: 'INFO',
    dir: DefaultLoggerManager.getAppLogDir(appName)
  });
}

export function getAppLogPath(appName, logName) {
  return join(DefaultLoggerManager.getAppLogDir(appName), logName + '.log');
}

const eolReg = new RegExp(EOL + '$');

export function removeEOL(str: string): string {
  eolReg.lastIndex = 0;
  return str.replace(eolReg, '');
}
