'use strict';
require('source-map-support').install();

import {APP_START_SUCCESS, APP_START_ERROR} from '../const';
import assert = require('assert');
import {consoleLogger} from '../universal/LoggerBroker';
import {ApplicationRepresentation} from '../domain';
import {makeRequire} from 'pandora-dollar';
import {SpawnWrapperUtils} from '../daemon/SpawnWrapperUtils';

const program = require('commander');

/**
 * Class ProcessBootstrap
 */
export class ProcessBootstrap {

  entry: string;
  options: ApplicationRepresentation;

  constructor(entry: string, options: ApplicationRepresentation) {
    this.entry = entry;
    this.options = options;
  }

  /**
   * start process
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {

    if ('fork' === this.options.mode) {
      SpawnWrapperUtils.wrap();
    }

    const entryFileBaseDir = this.options.entryFileBaseDir;
    const ownRequire = entryFileBaseDir ? makeRequire(entryFileBaseDir) : require;
    const entryMod = ownRequire(this.entry);

    // Only require that entry if the mode be fork
    if ('fork' === this.options.mode) {
      return;
    }

    // Otherwise it needs the entire procedures.
    const entryFn = 'function' === typeof entryMod ? entryMod : entryMod.default;
    assert('function' === typeof entryFn, 'The entry should export a function, during loading ' + this.entry);
    await new Promise((resolve, reject) => {
      const options = {...this.options || {}};
      if (entryFn.length >= 2) {
        entryFn(options, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      } else {
        entryFn(options);
        resolve();
      }
    });
  }

  static cmd() {
    program
      .option('--entry [entry]')
      .option('--params [params]')
      .parse(process.argv);

    const entry = program.entry;
    let options = program.params;

    try {
      options = JSON.parse(options);
    } catch (err) {
      err.message = `Invalid options "${options}", ${err.message}`;
      throw err;
    }

    const processBootstrap = new ProcessBootstrap(entry, options);

    processBootstrap.start().then(() => {
      if (process.send) {
        process.send({action: APP_START_SUCCESS});
      }
    }).catch((err) => {
      consoleLogger.error(err);
      consoleLogger.error('An error occurred during the start of ProcessBootstrap.');
      if (process.send) {
        process.send({action: APP_START_ERROR, error: err});
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

// require.main === module maybe be 'false' after patched spawn wrap
if (require.main === module || process.env.RUN_PROCESS_BOOTSTRAP_BY_FORCE) {
  delete process.env.RUN_PROCESS_BOOTSTRAP_BY_FORCE;
  cmd();
}
