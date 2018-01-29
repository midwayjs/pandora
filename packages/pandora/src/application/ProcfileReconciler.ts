'use strict';
import {makeRequire, resolveSymlink} from 'pandora-dollar';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {
  Entry, EntryClass, ApplicationRepresentation, ApplicationStructureRepresentation
  , ProcessRepresentation, ServiceRepresentation, CategoryReg
} from '../domain';
import assert = require('assert');
import {join, dirname, basename, extname} from 'path';
import {existsSync, writeFileSync} from 'fs';
import {defaultWorkerCount, PROCFILE_NAMES} from '../const';
import {ProcfileReconcilerAccessor} from './ProcfileReconcilerAccessor';
import {exec} from 'child_process';
import uuid = require('uuid');
import mzFs = require('mz/fs');
import {tmpdir} from 'os';

const foundAll = Symbol();

/**
 * Class ProcfileReconciler
 * TODO: Add more description
 */
export class ProcfileReconciler {

  public appRepresentation: ApplicationRepresentation = null;
  public procfileBasePath: string = null;

  protected discovered = false;

  protected procfileReconcilerAccessor: ProcfileReconcilerAccessor = null;

  protected defaultServiceCategory: CategoryReg;

  protected environmentClass: EntryClass = null;

  protected processes: Array<ProcessRepresentation> = [];
  protected services: Array<ServiceRepresentation> = [];


  protected get uniqServices(): Array<ServiceRepresentation> {
    const nameMap: Map<string, boolean> = new Map;
    const ret = [];
    for (const service of this.services.reverse()) {
      if (!nameMap.has(service.serviceName)) {
        nameMap.set(service.serviceName, true);
        ret.push(service);
      }
    }
    return ret.reverse();
  }

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

    // Attach default procfile
    const {procfile: defaultProcfile} = GlobalConfigProcessor.getInstance().getAllProperties();
    this.callProcfile(defaultProcfile);

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
   * setDefaultServiceCategory
   * @param {CategoryReg} name
   */
  setDefaultServiceCategory (name: CategoryReg) {
    this.defaultServiceCategory = name;
  }

  /**
   * getDefaultServiceCategory
   * @return {CategoryReg}
   */
  getDefaultServiceCategory () {
    if(!this.defaultServiceCategory) {
      throw new Error('Should ProcfileReconciler.setDefaultServiceCategory() before ProcfileReconciler.getDefaultServiceCategory().');
    }
    return this.defaultServiceCategory;
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
   * Inject environment class
   * @param {Entry} entry
   */
  injectEnvironment(entry: Entry) {
    this.environmentClass = this.normalizeEntry(entry);
  }

  /**
   * Get environment class
   * @return {EntryClass}
   */
  getEnvironment(): EntryClass {
    if (!this.environmentClass) {
      throw new Error('Should ProcfileReconciler.injectEnvironment() before ProcfileReconciler.getEnvironment().');
    }
    return this.environmentClass;
  }

  /**
   * Inject service class
   * @param serviceRepresentation
   * @return {ServiceRepresentation}
   */
  injectService(serviceRepresentation): ServiceRepresentation {
    const serviceEntry = this.normalizeEntry(serviceRepresentation.serviceEntry);
    const ret = {
      config: {},
      ...serviceRepresentation,
      serviceName: serviceRepresentation.serviceName || (<any> serviceEntry).lazyName ||  (<any> serviceEntry).serviceName || (<any> serviceEntry).name,
      category: serviceRepresentation.category || this.getDefaultServiceCategory(),
      serviceEntry: serviceEntry
    };
    this.services.push(ret);
    return ret;
  }

  /**
   * Get a service representation by name
   * @param lookingFor
   * @return {ServiceRepresentation}
   */
  getServiceByName (lookingFor): ServiceRepresentation {
    for(const service of this.services) {
      if(lookingFor === service.serviceName) {
        return service;
      }
    }
    return null;
  }

  /**
   * Drop a service representation by name
   */
  dropServiceByName (lookingFor) {
    for(let idx = 0, len = this.services.length; idx < len; idx++) {
      const service = this.services[idx];
      if(lookingFor === service.serviceName) {
        this.services.splice(idx, 1);
        return;
      }
    }
    throw new Error(`Can\'t drop a service named ${lookingFor} it not exist`);
  }

  /**
   * Get services by category
   * @param {string} category
   * @return {ServiceRepresentation[]}
   */
  getServicesByCategory(category: string, simple?): ServiceRepresentation[] {
    const serviceFullSet = this.uniqServices;
    const retSet = [];
    for (const service of serviceFullSet) {
      if (service.category === category || category === 'all'
        || service.category === 'all' || service.category === 'weak-all') {

        if(simple) {
          retSet.push(service);
          continue;
        }

        const serviceEntry = (<any> service.serviceEntry).getLazyClass
          ? (<any> service.serviceEntry).getLazyClass() : service.serviceEntry;

        // Sucks code below, just unique the dependencies array...
        service.dependencies = <string[]> [...new Set((serviceEntry.dependencies || []).concat(service.dependencies || []))];

        retSet.push(service);
      }
    }
    return retSet;
  }

  /**
   * Get all available processes
   * @return {any}
   */
  protected getAvailableProcessMap () {

    const availableProcessMap = {};

    /**
     * Allocate services
     */
    for (const service of this.getServicesByCategory('all', true)) {
      if(service.category === 'all') {
        return foundAll;
      }
      if (service.category === 'weak-all') {
        continue;
      }
      const process = this.getProcessByName(service.category);
      if (!process) {
        throw new Error(`Can't allocate service ${service.serviceName} at category ${service.category} to any process.`);
      }
      availableProcessMap[service.category] = true;
    }

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

    const tmpFile = join(tmpdir(), uuid.v4());
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

