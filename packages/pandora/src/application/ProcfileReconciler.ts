'use strict';
import {makeRequire, resolveSymlink} from 'pandora-dollar';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {
  Entry, EntryClass, ApplicationRepresentation, ApplicationStructureRepresentation
  , ProcessRepresentation, ServiceRepresentation, ComplexApplicationStructureRepresentation, MountRepresentation,
  CategoryReg
} from '../domain';
import assert = require('assert');
import {join, dirname, basename, extname} from 'path';
import {existsSync, writeFileSync} from 'fs';
import {PROCFILE_NAMES} from '../const';
import {ProcfileReconcilerAccessor} from './ProcfileReconcilerAccessor';
import {exec} from 'child_process';
import {tmpdir} from 'os';
import uuid = require('uuid');
import mzFs = require('mz/fs');

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
    processRepresentation = {
      env: {}, argv: [],
      ...this.appRepresentation,
      ...processRepresentation,
      entryFileBaseDir: this.procfileBasePath
    };
    this.processes.push(processRepresentation);
    return processRepresentation;
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

    return availableProcessMap;

  }

  // TODO: 将 getApplicationStructure 和 getComplexApplicationStructureRepresentation 彻底合并
  /**
   * Get the application's structure
   * @returns {ApplicationStructureRepresentation}
   */
  getApplicationStructure(): ApplicationStructureRepresentation {

    const availableProcessMap = this.getAvailableProcessMap();
    const processRepresentations: ProcessRepresentation[] = [];

    for(const process of this.processes) {
      if(
        process.mode === 'procfile.js' &&
        (foundAll === availableProcessMap || availableProcessMap.hasOwnProperty(process.processName))
      ) {
        processRepresentations.push(this.processGlobalForProcess(process));
      }
    }

    const processRepresentationSet2nd = processRepresentations.sort((a, b) => {
      return a.order - b.order;
    });

    return {
      ...this.appRepresentation,
      mode: 'procfile.js',
      process: processRepresentationSet2nd
    };

  }

  /**
   * Get the complex application's structure
   * @returns {ApplicationStructureRepresentation}
   */
  getComplexApplicationStructureRepresentation(): ComplexApplicationStructureRepresentation {

    const processes: ProcessRepresentation[] = this.processes;
    const mount: MountRepresentation[] = [];

    const applicationStructure = this.getApplicationStructure();
    if(applicationStructure.process.length) {
      mount.push(applicationStructure);
    }

    for(const process of processes) {
      if( process.mode === 'fork' ) {
        mount.push(this.processGlobalForProcess(process));
      }
    }

    return { mount };
  }

  public static echoComplex(appRepresentation: ApplicationRepresentation, writeTo: string) {
    const procfileReconciler = new ProcfileReconciler(appRepresentation);
    procfileReconciler.discover();
    const complex = procfileReconciler.getComplexApplicationStructureRepresentation();
    writeFileSync(writeTo, JSON.stringify(complex));
  }

  public static async getComplexViaNewProcess(appRepresentation: ApplicationRepresentation): Promise<ComplexApplicationStructureRepresentation> {

    const tmpFile = join(tmpdir(), uuid.v4());
    const isTs = /\.ts$/.test(__filename);

    await new Promise((resolve, reject) => {
      exec(`${process.execPath} ${ isTs ? '-r ts-node/register' : ''} -e 'require("${__filename}").ProcfileReconciler.echoComplex(${JSON.stringify(appRepresentation)}, ${JSON.stringify(tmpFile)})'`,
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
    const complex: ComplexApplicationStructureRepresentation = JSON.parse(fileContent);

    return complex;

  }

  private processGlobalForProcess (process): ProcessRepresentation {
    const argv = process.globalArgv ? (process.argv || []).concat(process.globalArgv) : process.argv;
    const env = process.globalEnv ? {...process.env, ...process.globalEnv} : process.env;
    return {
      ...process,
      argv, env
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

