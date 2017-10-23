import assert = require('assert');
import {ConfigInterface, ILogger, LoggerConfig} from './domain';
import {DefaultLoggerManager} from './DefaultLoggerManager';

export class LoggerService {

  core: any;
  protected loggerMap: Map<string, any> = new Map;
  protected defaultLoggerManager: DefaultLoggerManager;

  constructor() {
    this.defaultLoggerManager = DefaultLoggerManager.getInstance();
  }

  async start(): Promise<void> {
    const config: ConfigInterface = this.core.config;
    const loggers = <{ [loggerName: string]: LoggerConfig }> config.loggers || {};
    for(let loggerName of Object.keys(loggers)) {
      if(!this.loggerMap.has(loggerName)) {
        const loggerConfig = loggers[loggerName];
        this.createLogger(loggerName, loggerConfig);
      }
    }
  }

  public getLogger(loggerName): any {
    assert(this.loggerMap.has(loggerName), `Could not found logger named ${loggerName}`);
    const logger = this.loggerMap.get(loggerName);
    return logger;
  }

  public createLogger(loggerName: string, loggerConfig: LoggerConfig): ILogger {
    assert(!this.loggerMap.has(loggerName), `Logger named ${loggerName} already has`);
    const newLogger = this.defaultLoggerManager.createLogger(loggerName, loggerConfig);
    this.loggerMap.set(loggerName, newLogger);
    return newLogger;
  }

}
