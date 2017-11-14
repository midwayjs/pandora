'use strict';
import {ApplicationRepresentation} from '../domain';
import {ComplexHandler} from '../daemon/ComplexHandler';
import {consoleLogger} from '../universal/LoggerBroker';
import {ProcessBootstrap} from '../application/ProcessBootstrap';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
const globalConfigProcessor = GlobalConfigProcessor.getInstance();

/**
 * Class DebugApplicationLoader
 * For a profile.js application to debugging
 */
export class DebugApplicationLoader {
  protected options: ApplicationRepresentation;
  protected master: ComplexHandler | ProcessBootstrap;

  constructor(options: ApplicationRepresentation) {
    this.options = options;
  }

  /**
   * Start debug application
   * @return {Promise<void>}
   */
  async start() {

    globalConfigProcessor.getAllProperties();
    globalConfigProcessor.mergeProperties({
      logger: {
        appLogger: {
          stdoutLevel: 'ALL',
          level: 'NONE'
        }
      }
    });

    process.env.NODE_ENV = process.env.NODE_ENV || 'local';
    const mode = this.options.mode || 'procfile.js';
    const appName = this.options.appName || 'debug';
    const options = {
      ...this.options,
      mode, appName
    };
    if(!this.master) {
      if('fork' === mode) {
        this.master = new ProcessBootstrap(options.entryFile, options);
      } else {
        this.master = new ComplexHandler(options);
      }
    }
    this.master.start().then(() => {
      console.log('Debug application start successful.');
    }).catch((err) => {
      consoleLogger.error(err);
    });
  }

}

