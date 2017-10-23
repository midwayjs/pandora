import {join} from 'path';
import {LoggerManager} from './LoggerManager';
import {homedir} from 'os';

export const stdLogBaseDir = join(homedir(), 'logs');
export const pandoraLogsDir = join(stdLogBaseDir, 'pandorajs');
export class DefaultLoggerManager extends LoggerManager {

  private static instance;
  private pandoraDefaultLogger;

  private constructor(options?) {
    super(options);
  }

  /**
   * get default logger
   */
  public getDefaultLogger() {
    if(!this.pandoraDefaultLogger) {
      this.pandoraDefaultLogger = this.createLogger('midway-pandora', {
        type: 'date',
        dir: pandoraLogsDir
      });
    }
  }

  /**
   * Get single instance of DefaultLoggerManager
   * @return {any}
   */
  static getInstance() {
    if(!DefaultLoggerManager.instance) {
      DefaultLoggerManager.instance = new DefaultLoggerManager({
        connectRotator: true
      });
    }
    return DefaultLoggerManager.instance;
  }

  /**
   * Get pandora's log dir
   * @return {any}
   */
  static getPandoraLogsDir() {
    return pandoraLogsDir;
  }

  /**
   * Get Application's log dir by appName
   * @param appName
   * @return {any}
   */
  static getAppLogDir(appName) {
    return join(stdLogBaseDir, appName);
  }
}
