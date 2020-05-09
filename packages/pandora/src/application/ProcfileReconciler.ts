'use strict';
import {makeRequire, resolveSymlink} from '@pandorajs/dollar';
import { EntryClass, ApplicationRepresentation, ApplicationStructureRepresentation
  , ProcessRepresentation } from '../types';
import assert = require('assert');
import {join, dirname, basename, extname} from 'path';
import {existsSync, writeFileSync} from 'fs';
import {defaultWorkerCount, PROCFILE_NAMES} from '../const';
import {ProcfileReconcilerAccessor} from './ProcfileReconcilerAccessor';
import {exec} from 'child_process';
import uuid = require('uuid');
import mzFs = require('mz/fs');
import * as os from 'os';

const tmpdir = process.env.PANDORA_TMP_DIR || os.tmpdir();
const foundAll = Symbol();

/**
 * Class ProcfileReconciler
 */
export class ProcfileReconciler {

  public appRepresentation: ApplicationRepresentation = null;
  public procfileBasePath: string = null;
  protected discovered = false;
  protected procfileReconcilerAccessor: ProcfileReconcilerAccessor = null;
  protected processes: Array<ProcessRepresentation> = [];

  protected get appDir() {
    assert(
      this.appRepresentation && this.appRepresentation.appDir,
      'Can not get appDir from ProcfileReconciler.appRepresentation, it should passed from time of constructing ProcfileReconciler'
    );
    return this.appRepresentation.appDir;
  }

  constructor(appRepresentation: ApplicationRepresentation) {
    this.appRepresentation = appRepresentation;
    this.procfileReconcilerAccessor = new ProcfileReconcilerAccessor(this);
  }

  /**
   * Find out all possibly profile.js paths
   * @return {Array}
   */
  resovle() {
    const retSet = [];
    const appDir = this.appDir;
    const findBasePath = [
      join(appDir, 'node_modules/.bin'),
      appDir
    ];
    for (const basePath of findBasePath) {
      for (const alias of PROCFILE_NAMES) {
        const targetPath = join(basePath, alias);
        if (existsSync(targetPath)) {
          retSet.push(targetPath);
        }
      }
    }
    return retSet;
  }

  /**
   * Discover procfile.js in appDir, and apply them.
   */
  discover() {
    if (this.discovered) {
      return;
    }
    const procfileTargets = this.resovle();
    for (const target of procfileTargets) {
      const targetMod = require(target);
      const entryFn = 'function' === typeof targetMod ? targetMod : targetMod.default;
      assert('function' === typeof entryFn, 'The procfile should export a function, during loading ' + target);
      this.callProcfile(entryFn, getProcfileBasePath(target));
    }
    this.discovered = true;
  }

  /**
   * callProcfile required a argument as typed function, then call that function, pass ProcfileReconcilerAccessor as the first argument of that function.
   * @param entryFn
   * @param path
   */
  callProcfile(entryFn, path?) {
    try {
      this.procfileBasePath = path || null;
      /**
       * inject a pandora object
       * example: exports = (pandora) => {}
       */
      entryFn(this.procfileReconcilerAccessor);
    } finally {
      this.procfileBasePath = null;
    }
  }

  /**
   * Normalize entry class, entry class such as service class
   * Those classes have a lazy way to represent, it can get a relative path
   * this method will wrap that relative path to a real class
   * @param entry
   * @return {EntryClass}
   */
  normalizeEntry(entry): EntryClass {
    if ('string' === typeof entry && this.procfileBasePath) {
      const procfileBasePath = this.procfileBasePath;

      function getLazyClass() {
        const targetMod = makeRequire(procfileBasePath)(entry);
        const TargetClass = 'function' === typeof targetMod ? targetMod : targetMod.default;
        return TargetClass;
      }

      function LazyEntry(option: any) {
        const LazyClass = getLazyClass();
        return new LazyClass(option);
      }

      (<any> LazyEntry).lazyEntryMadeBy = entry;
      (<any> LazyEntry).lazyName = basename(entry, extname(entry));
      (<any> LazyEntry).getLazyClass = getLazyClass;
      return <EntryClass> <any> LazyEntry;
    }
    return entry;
  }

  /**
   * Define process representation
   * @param processRepresentation
   * @return {ProcessRepresentation}
   */
  defineProcess(processRepresentation): ProcessRepresentation {
    const processRepresentation2nd: ProcessRepresentation = {
      env: {}, execArgv: [], args: [], scale: 1,
      ...this.appRepresentation,
      ...processRepresentation,
      entryFileBaseDir: this.procfileBasePath
    };
    this.processes.push(processRepresentation2nd);
    return processRepresentation2nd;
  }

  /**
   * Get a process representation by name
   * @param lookingFor
   * @return {ProcessRepresentation}
   */
  getProcessByName(lookingFor): ProcessRepresentation {
    for(const process of this.processes) {
      if(process.processName === lookingFor) {
        return process;
      }
    }
    return null;
  }

  /**
   * Drop a process representation by name
   */
  dropProcessByName (lookingFor) {
    for(let idx = 0, len = this.processes.length; idx < len; idx++) {
      const process = this.processes[idx];
      if(lookingFor === process.processName) {
        this.processes.splice(idx, 1);
        return;
      }
    }
    throw new Error(`Can\'t drop a process named ${lookingFor} it not exist`);
  }

  /**
   * Get all available processes
   * @return {any}
   */
  protected getAvailableProcessMap () {

    const availableProcessMap = {};
    for(const process of this.processes) {
      if(process.entryFile && !availableProcessMap.hasOwnProperty(process.processName)) {
        availableProcessMap[process.processName] = true;
      }
    }

    return availableProcessMap;

  }

  /**
   * Get the Static Structure of the Application
   * @return {ApplicationStructureRepresentation}
   */
  getApplicationStructure(): ApplicationStructureRepresentation {

    const availableProcessMap = this.getAvailableProcessMap();
    const processRepresentations: ProcessRepresentation[] = [];

    let offset = 0;
    for(const process of this.processes) {
      if(
        foundAll === availableProcessMap || availableProcessMap.hasOwnProperty(process.processName)
      ) {
        const newProcess = this.makeupProcess(process);
        newProcess.offset = offset;
        offset += <number> newProcess.scale > 1 ? <number> newProcess.scale + 1 : 1;
        processRepresentations.push(newProcess);
      }
    }

    const processRepresentationSet2nd = processRepresentations.sort((a, b) => {
      return a.order - b.order;
    });

    return {
      ...this.appRepresentation,
      process: processRepresentationSet2nd
    };

  }

  /**
   * Echo the appRepresentation to a file
   * For static getStructureViaNewProcess() read
   * @param {ApplicationRepresentation} appRepresentation
   * @param {string} writeTo
   */
  public static echoStructure(appRepresentation: ApplicationRepresentation, writeTo: string) {
    const procfileReconciler = new ProcfileReconciler(appRepresentation);
    procfileReconciler.discover();
    const structure = procfileReconciler.getApplicationStructure();
    writeFileSync(writeTo, JSON.stringify(structure));
  }

  /**
   * Get the appRepresentation via a tmp process
   * Make sure daemon will not got any we don\'t want to be included
   * @param {ApplicationRepresentation} appRepresentation
   * @return {Promise<ApplicationStructureRepresentation>}
   */
  public static async getStructureViaNewProcess(appRepresentation: ApplicationRepresentation): Promise<ApplicationStructureRepresentation> {

    const tmpFile = join(tmpdir, uuid.v4());
    const isTs = /\.ts$/.test(__filename);

    await new Promise((resolve, reject) => {
      exec(`${process.execPath} ${ isTs ? '-r ts-node/register' : ''} -e 'require("${__filename}").ProcfileReconciler.echoStructure(${JSON.stringify(appRepresentation)}, ${JSON.stringify(tmpFile)}); process.exit()'`,
        {
          cwd: appRepresentation.appDir || process.cwd()
        },
        (error) => {
          if(error) {
            reject(error);
            return;
          }
          resolve();
        });
    });

    const fileBuffer = await mzFs.readFile(tmpFile);
    await mzFs.unlink(tmpFile);

    const fileContent = fileBuffer.toString();
    const structure: ApplicationStructureRepresentation = JSON.parse(fileContent);
    return structure;

  }

  /**
   *
   * @param process
   * @return {ProcessRepresentation}
   */
  private makeupProcess(process: ProcessRepresentation): ProcessRepresentation {

    // globalArgv and globalEnv passed from CLI, marge those to the related field
    const execArgv = process.globalExecArgv ? (process.execArgv || []).concat(process.globalExecArgv) : process.execArgv;
    const args = process.globalArgs ? (process.args || []).concat(process.globalArgs) : process.args;
    const env = process.globalEnv ? {...process.env, ...process.globalEnv} : process.env;

    // Resolve 'auto' to cpus().length
    const scale = process.scale === 'auto' ? defaultWorkerCount : process.scale;

    return {
      ...process,
      execArgv, args, env, scale
    };

  }

}

/**
 * Get procfile's dirname through resolved symlink
 * @param tagetPath
 * @return {any}
 */
function getProcfileBasePath(tagetPath) {
  const resolvedTarget = resolveSymlink(tagetPath);
  return dirname(resolvedTarget);
}

