import {LoggerManager} from './LoggerManager';

export class DefaultLoggerManager extends LoggerManager {

  private static instance;

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

}
