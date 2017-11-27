'use strict';
require('source-map-support').install();
import program = require('commander');
import {ERROR, FINISH_SHUTDOWN, READY, SHUTDOWN} from '../const';
import {WorkerContext} from './WorkerContext';
import {ProcessRepresentation} from '../domain';
import {ProcfileReconciler} from './ProcfileReconciler';
import assert = require('assert');
import {EnvironmentUtil} from 'pandora-env';
import {consoleLogger, getPandoraLogsDir} from '../universal/LoggerBroker';
import {MonitorManager} from '../monitor/MonitorManager';

/**
 * class WorkerProcessBootstrap
 * Bootstrap a worker process, handing all phases of an application stating
 */
export class WorkerProcessBootstrap {

  public context: WorkerContext;
  public entry: string;
  public processRepresentation: ProcessRepresentation;
  private procfileReconciler: ProcfileReconciler;

  /**
   * @param {string} entry - where is the entry file of this process of the application. that can be null,
   * use the ProcfileReconciler to start if that be null.
   * @param {ProcessRepresentation} processRepresentation - ProcessRepresentation object
   */
  constructor(entry: string, processRepresentation: ProcessRepresentation) {
    this.entry = entry;
    this.processRepresentation = processRepresentation;
    this.procfileReconciler = new ProcfileReconciler(processRepresentation);
    this.context = new WorkerContext(processRepresentation);
  }

  /**
   * Start process
   *  1. use the ProcfileReconciler to start if this.entry is not given
   *  2. use the this.entry to start if this.entry is given
   * @return {Promise<void>}
   */
  async start() {
    if (this.entry) {
      await this.startByEntry();
      return;
    }
    await this.startByProcfile();
  }

  async stop() {
    if (this.context) {
      await this.context.stop();
    }
  }

  /**
   * Use procfile.js to start
   * @returns {Promise<void>}
   */
  async startByProcfile() {

    const {mode} = this.processRepresentation;
    if ('procfile.js' === mode) {
      // Beginning discover the process structure by ProcfileReconciler if mode be procfile.js
      this.procfileReconciler.discover();
    }  else {
      throw new Error(`Unknown mode ${mode}`);
    }

    // Handing the environment object injecting
    const Environment = this.procfileReconciler.getEnvironment();
    const environment = new Environment({
      appDir: this.processRepresentation.appDir,
      appName: this.processRepresentation.appName,
      processName: this.processRepresentation.processName,
      pandoraLogsDir: getPandoraLogsDir()
    });
    EnvironmentUtil.getInstance().setCurrentEnvironment(environment);

    // Handing the services injecting
    const servicesByCurrentCategory = this.procfileReconciler.getServicesByCategory(this.processRepresentation.processName);
    this.context.bindService(servicesByCurrentCategory);

    // To start process by WorkerContext
    await this.context.start();

    // To start worker process monitoring
    MonitorManager.injectProcessMonitor();
  }

  /**
   * use this.entry to start
   * @returns {Promise<any>}
   */
  async startByEntry() {
    const entryMod = require(this.entry);
    const entryFn = 'function' === typeof entryMod ? entryMod : entryMod.default;
    assert('function' === typeof entryFn, 'The entry should export a function, during loading ' + this.entry);
    return await new Promise((resolve, reject) => {
      entryFn({...this.processRepresentation}, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * A static method to handing the CLI
   */
  static cmd() {
    program
      .option('--entry [entry]')
      .option('--params [params]')
      .parse(process.argv);

    const entry = program.entry;
    let options;

    try {
      options = JSON.parse(program.params);
      assert(options.appName, 'appName required by WorkerProcessBootstrap');
      assert(options.appDir, 'appDir required by WorkerProcessBootstrap');
      assert(options.processName, 'processName required by WorkerProcessBootstrap');
    } catch (err) {
      err.message = `invalid options "${program.params}", ${err.message}`;
      consoleLogger.error(err);
      if (process.send) {
        process.send({action: ERROR, error: err});
      }
      return;
    }

    const workerBootstrap = new WorkerProcessBootstrap(entry, options);
    workerBootstrap.start().then(() => {
      process.on('message', (message) => {
        if (message.action === SHUTDOWN) {
          workerBootstrap.stop().then(() => {
            if (process.send) {
              process.send({action: FINISH_SHUTDOWN});
            }
          });
        }
      });
      if (process.send) {
        process.send({action: READY});
      }
    }).catch((err) => {
      consoleLogger.error(err);
      consoleLogger.error('an error occurred during the start of WorkerProcessBootstrap.');
      if (process.send) {
        process.send({action: ERROR, error: err});
      }
    });
  }

}

let cmdDid = false;

export function cmd() {
  if (cmdDid) {
    return;
  }
  cmdDid = true;
  WorkerProcessBootstrap.cmd();
}

// Handing CLI if this module be the main module
if (require.main === module) {
  cmd();
}
