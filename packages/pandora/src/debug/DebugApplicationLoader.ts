'use strict';
import {ApplicationRepresentation} from '../domain';
import {ApplicationHandler} from '../application/ApplicationHandler';
import {consoleLogger} from '../universal/LoggerBroker';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {isDaemonRunning} from '../daemon/DaemonHandler';
import {Hub} from 'pandora-hub';
const globalConfigProcessor = GlobalConfigProcessor.getInstance();

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

     const daemonRunning = await isDaemonRunning();

     // start a IPC-Hub when no daemon
     if(!daemonRunning) {
         const ipcHub = new Hub();
         await ipcHub.start();
     }

    globalConfigProcessor.getAllProperties();
    globalConfigProcessor.mergeProperties({
      logger: {
        appLogger: {
          stdoutLevel: 'ALL',
          level: 'NONE'
        }
      }
    });

    process.env.PANDORA_DEV = 'true';
    process.env.NODE_ENV = process.env.NODE_ENV || 'local';
    const appName = this.representation.appName || 'debug';
    const options = {
      ...this.representation,
      appName
    };
    if(!this.master) {
        this.master = new ApplicationHandler(options);
    }
    this.master.start().then(() => {
      console.log('Debug application start successful.');
    }).catch((err) => {
      consoleLogger.error(err);
    });
  }

}

