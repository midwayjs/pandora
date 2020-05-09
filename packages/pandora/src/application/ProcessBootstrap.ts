'use strict';
require('source-map-support').install();
import program = require('commander');
import {PROCESS_ERROR, FINISH_SHUTDOWN, PROCESS_READY, SHUTDOWN, PANDORA_PROCESS} from '../const';
import {ProcessRepresentation} from '../types';
import assert = require('assert');
import {makeRequire} from '@pandorajs/dollar';
import {ScalableMaster} from './ScalableMaster';
import {SpawnWrapperUtils} from './SpawnWrapperUtils';
import {consoleLogger} from '@pandorajs/dollar';
import {CoreSDK} from '@pandorajs/core-sdk';
import {CoreSDKWithExtendedConfig} from '../util/CoreSDKWithExtendedConfig';

/**
 * class ProcessBootstrap
 * Bootstrap a worker process, handing all phases of an application stating
 */
export class ProcessBootstrap {

  public master: ScalableMaster;
  public processRepresentation: ProcessRepresentation;
  protected coreSdk: CoreSDK;

  constructor(processRepresentation: ProcessRepresentation) {
    this.processRepresentation = processRepresentation;
    if(this.processRepresentation.scale > 1) {
      this.master = new ScalableMaster(processRepresentation);
      return;
    } else {
      const {appName, appDir} = this.processRepresentation;
      this.coreSdk = new CoreSDKWithExtendedConfig({
        mode: 'worker',
        appName, appDir
      });
    }
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
    try {
      await this.coreSdk.stop();
    } catch(err) {
      // ignore
    }
    SpawnWrapperUtils.unwrap();
  }

  async startAsMaster() {
    await this.master.start();
  }

  async startAsWorker() {

    SpawnWrapperUtils.setAsFirstLevel();
    SpawnWrapperUtils.wrap();
    process.env[PANDORA_PROCESS] = JSON.stringify(this.processRepresentation);

    await this.coreSdk.start();

    // Require the entryFile if there given it, pandora.fork() dep on it
    if(this.processRepresentation.entryFile) {
      const entryFileBaseDir = this.processRepresentation.entryFileBaseDir;
      const ownRequire = entryFileBaseDir ? makeRequire(entryFileBaseDir) : require;
      ownRequire(this.processRepresentation.entryFile);
    }

  }


  /**
   * A static method to handing the CLI
   */
  static cmd() {

    program
      .allowUnknownOption()
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
    if(options.entryFile) {
      process.argv[1] = options.entryFile;
    }

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
