'use strict';
import {ApplicationRepresentation} from '../domain';
import {ApplicationHandler} from '../application/ApplicationHandler';
const {consoleLogger} = require('../../cli/util/cliUtils');

/**
 * Class DebugApplicationLoader
 * For a profile.js application to debugging
 */
export class DebugApplicationLoader {
  protected representation: ApplicationRepresentation;
  protected master: ApplicationHandler;

  constructor(representation: ApplicationRepresentation) {
    this.representation = representation;
  }

  /**
   * Start debug application
   * @return {Promise<void>}
   */
  async start() {

    process.env.PANDORA_DEV = 'true';
    process.env.NODE_ENV = process.env.NODE_ENV || 'local';
    const appName = this.representation.appName || 'debug';
    const options = {
      ...this.representation,
      appName
    };

    this.master = new ApplicationHandler(options);

    const onProcessTerm = (sig) => {
      consoleLogger.log();
      consoleLogger.important(`Receive a signal ${sig}, trying to stop...`);
      this.stop().then(() => {
        process.exit(0);
      }).catch((err) => {
        consoleLogger.error(err);
        process.exit(1);
      });
    };

    this.master.start().then(() => {
      consoleLogger.important('Application start successful.');
      process.once('SIGQUIT', onProcessTerm.bind(null, 'SIGQUIT'));
      process.once('SIGTERM', onProcessTerm.bind(null, 'SIGTERM'));
      process.once('SIGINT', onProcessTerm.bind(null, 'SIGINT'));
    }).catch((err) => {
      consoleLogger.error(err);
    });

  }

  async stop() {
    if(this.master) {
      await this.master.stop();
    }
  }

}

