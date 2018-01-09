'use strict';
require('source-map-support').install();
import program = require('commander');
import {PROCESS_ERROR, FINISH_SHUTDOWN, PROCESS_READY, SHUTDOWN, PANDORA_PROCESS} from '../const';
import {ProcessContext} from './ProcessContext';
import {ProcessRepresentation} from '../domain';
import {ProcfileReconciler} from './ProcfileReconciler';
import assert = require('assert');
import {EnvironmentUtil} from 'pandora-env';
import {consoleLogger, getPandoraLogsDir} from '../universal/LoggerBroker';
import {MonitorManager} from '../monitor/MonitorManager';
import {Facade} from '../Facade';
import {makeRequire} from 'pandora-dollar';
import {ScalableMaster} from './ScalableMaster';
import {SpawnWrapperUtils} from './SpawnWrapperUtils';

/**
 * class ProcessBootstrap
 * Bootstrap a worker process, handing all phases of an application stating
 */
export class ProcessBootstrap {

  public master: ScalableMaster;
  public context: ProcessContext;
  public processRepresentation: ProcessRepresentation;
  private procfileReconciler: ProcfileReconciler;

  constructor(processRepresentation: ProcessRepresentation) {

    this.processRepresentation = processRepresentation;
    this.procfileReconciler = new ProcfileReconciler(processRepresentation);

    if(this.processRepresentation.scale > 1) {
      this.master = new ScalableMaster(processRepresentation);
      return;
    }

    this.context = new ProcessContext(processRepresentation);
    Facade.set('processContext', this.context.processContextAccessor);

  }

  async start() {

    if(this.master) {
      await this.startAsMaster();
      return;
    }
    await this.startAsWorker();

  }

  async stop() {

    if(this.master) {
      await this.master.stop();
      return;
    }

    // Stop as worker
    await this.context.stop();
    SpawnWrapperUtils.unwrap();

  }

  async startAsMaster() {

    this.injectMonitor();
    await this.master.start();

  }

  async startAsWorker() {

    SpawnWrapperUtils.wrap();

    process.env[PANDORA_PROCESS] = JSON.stringify(this.processRepresentation);

    this.procfileReconciler.discover();

    this.injectMonitor();

    // Handing the services injecting
    const servicesByCurrentCategory = this.procfileReconciler.getServicesByCategory(this.processRepresentation.processName);
    this.context.bindService(servicesByCurrentCategory);

    // To start process by ProcessContext
    await this.context.start();

    // Require the entryFile if there given it, pandora.fork() dep on it
    if(this.processRepresentation.entryFile) {
      const entryFileBaseDir = this.processRepresentation.entryFileBaseDir;
      const ownRequire = entryFileBaseDir ? makeRequire(entryFileBaseDir) : require;
      ownRequire(this.processRepresentation.entryFile);
    }

  }

  injectMonitor() {

    if(!EnvironmentUtil.getInstance().isReady()) {
      // Handing the environment object injecting
      const Environment = this.procfileReconciler.getEnvironment();
      const environment = new Environment({
        appDir: this.processRepresentation.appDir,
        appName: this.processRepresentation.appName,
        processName: this.processRepresentation.processName,
        pandoraLogsDir: getPandoraLogsDir()
      });
      EnvironmentUtil.getInstance().setCurrentEnvironment(environment);
    }

    // To start worker process monitoring
    MonitorManager.injectProcessMonitor();

  }


  /**
   * A static method to handing the CLI
   */
  static cmd() {

    program
      .option('--params [params]')
      .parse(process.argv);

    let options;

    try {
      options = JSON.parse(program.params);
      assert(options.appName, 'The field appName required by ProcessBootstrap');
      assert(options.appDir, 'The field appDir required by ProcessBootstrap');
      assert(options.processName, 'The field processName required by ProcessBootstrap');
    } catch (err) {
      err.message = `Invalid options "${program.params}", ${err.message}`;
      consoleLogger.error(err);
      if (process.send) {
        process.send({action: PROCESS_ERROR, error: err});
      }
      return;
    }

    (<any> process).__pandoraOriginArgv = Array.from(process.argv);
    Array.prototype.splice.apply(process.argv, [
      2, process.argv.length - 2,
      ...(options.args || [])
    ]);

    const processBootstrap = new ProcessBootstrap(options);

    process.on('message', (message) => {
      if (message.action === SHUTDOWN) {
        processBootstrap.stop().then(() => {
          if (process.send) {
            process.send({action: FINISH_SHUTDOWN});
          }
        }).catch(consoleLogger.error);
      }
    });

    const onProcessTerm = (sig) => {
      consoleLogger.info(`Process [name = ${options.processName}, pid = ${process.pid}] Receive a signal ${sig}, start to stopping, pid ${process.pid}`);
      processBootstrap.stop().then(() => {
        process.exit(0);
      }).catch((err) => {
        consoleLogger.error(err);
        process.exit(1);
      });
    };

    process.once('SIGQUIT', onProcessTerm.bind(null, 'SIGQUIT'));
    process.once('SIGTERM', onProcessTerm.bind(null, 'SIGTERM'));
    process.once('SIGINT', onProcessTerm.bind(null, 'SIGINT'));

    processBootstrap.start().then(() => {
      if (process.send) {
        process.send({action: PROCESS_READY});
      }
    }).catch((err) => {
      consoleLogger.error(err);
      consoleLogger.error('An error occurred during the start of ProcessBootstrap.');
      if (process.send) {
        process.send({action: PROCESS_ERROR, error: err});
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
  ProcessBootstrap.cmd();
}

// Handing CLI if this module be the main module
if (require.main === module || process.env.RUN_PROCESS_BOOTSTRAP_BY_FORCE) {
  delete process.env.RUN_PROCESS_BOOTSTRAP_BY_FORCE;
  cmd();
}
