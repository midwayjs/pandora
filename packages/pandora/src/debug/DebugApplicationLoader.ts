'use strict';
import {ApplicationRepresentation} from '../domain';
import {ProcessMaster} from '../application/ProcessMaster';
import {consoleLogger} from '../universal/LoggerBroker';
import {ApplicationHandler} from '../application/ApplicationHandler';

/**
 * Class DebugApplicationLoader
 * For a profile.js application to debugging
 */
export class DebugApplicationLoader {
  protected options: ApplicationRepresentation;
  protected master: ProcessMaster | ApplicationHandler;

  constructor(options: ApplicationRepresentation) {
    this.options = options;
  }

  /**
   * Start debug application
   * @return {Promise<void>}
   */
  async start() {
    process.env.NODE_ENV = process.env.NODE_ENV || 'local';
    const mode = this.options.mode || 'procfile.js';
    const appName = this.options.appName || 'debug';
    const options = {
      ...this.options,
      mode, appName
    };
    if(!this.master) {
      if('fork' === mode) {
        this.master = new ApplicationHandler(options);
      } else {
        this.master = new ProcessMaster(options);
      }
    }
    this.master.start().then(() => {
      console.log('Debug application start successful.');
    }).catch((err) => {
      consoleLogger.error(err);
    });
  }
}


