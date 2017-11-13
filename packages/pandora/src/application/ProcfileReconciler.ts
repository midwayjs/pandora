'use strict';
import {makeRequire, resolveSymlink} from 'pandora-dollar';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {
  Entry, EntryClass, AppletRepresentation, ApplicationRepresentation, ApplicationStructureRepresentation
  , ProcessRepresentation, ServiceRepresentation, ComplexApplicationStructureRepresentation, MountRepresentation,
  CategoryReg
} from '../domain';
import assert = require('assert');
import {join, dirname, basename, extname} from 'path';
import {existsSync} from 'fs';
import {PROCFILE_NAMES} from '../const';
import {consoleLogger} from '../universal/LoggerBroker';
import {ProcfileReconcilerAccessor} from './ProcfileReconcilerAccessor';
import {exec} from 'child_process';

const foundAll = Symbol();

/**
 * Class ProcfileReconciler
 * TODO: Add more description
 */
export class ProcfileReconciler {

  public appRepresentation: ApplicationRepresentation = null;
  protected procfileBasePath: string = null;
  protected discovered = false;

  protected procfileReconcilerAccessor: ProcfileReconcilerAccessor = null;

  protected defaultAppletCategory: CategoryReg;
  protected defaultServiceCategory: CategoryReg;

  protected configuratorClass: EntryClass = null;
  protected environmentClass: EntryClass = null;

  protected processes: Array<ProcessRepresentation> = [];
  protected services: Array<ServiceRepresentation> = [];
  protected applets: Array<AppletRepresentation> = [];


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

  protected get uniqApplets(): Array<AppletRepresentation> {
    const nameMap: Map<string, boolean> = new Map;
    const ret = [];
    for (const applet of this.applets.reverse()) {
      if (!nameMap.has(applet.appletName)) {
        nameMap.set(applet.appletName, true);
        ret.push(applet);
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
      try {
        const targetMod = require(target);
        const entryFn = 'function' === typeof targetMod ? targetMod : targetMod.default;
        assert('function' === typeof entryFn, 'The procfile should export a function, during loading ' + target);
        this.callProcfile(entryFn, getProcfileBasePath(target));
      } catch (err) {
        consoleLogger.error('Fail to load procfile from path ' + target);
        throw err;
      }
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
   * Normalize entry class, entry class such as applet class, service class and configurator class
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
   * Convert class name to instance name
   * @param {string} name
   * @return {string}
   */
  normalizeName(name: string): string {
    return name;
  }

  /**
   * setDefaultAppletCategory
   * @param {CategoryReg} name
   */
  setDefaultAppletCategory (name: CategoryReg) {
    this.defaultAppletCategory = name;
  }

  /**
   * getDefaultAppletCategory
   * @return {CategoryReg}
   */
  getDefaultAppletCategory () {
    if(!this.defaultAppletCategory) {
      throw new Error('Should ProcfileReconciler.setDefaultAppletCategory() before ProcfileReconciler.getDefaultAppletCategory().');
    }
    return this.defaultAppletCategory;
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
      ...this.appRepresentation,
      ...processRepresentation
    };
    this.processes.push(processRepresentation);
    return processRepresentation;
  }

  /**
   * Get a process representation by name
   * @param processName
   * @return {ProcessRepresentation}
   */
  getProcessByName(processName): ProcessRepresentation {
    for(const process of this.processes) {
      if(process.processName === processName) {
        return process;
      }
    }
    return null;
  }

  /**
   * Inject configurator class
   * @param {Entry} entry
   */
  injectConfigurator(entry: Entry) {
    this.configuratorClass = this.normalizeEntry(entry);
  }

  /**
   * Get configurator class
   * @return {EntryClass}
   */
  getConfigurator(): EntryClass {
    if(!this.configuratorClass) {
      throw new Error('Should ProcfileReconciler.injectConfigurator() before ProcfileReconciler.getConfigurator().');
    }
    return this.configuratorClass;
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
      ...serviceRepresentation,
      serviceName: this.normalizeName(serviceRepresentation.serviceName || (<any> serviceEntry).lazyName ||  (<any> serviceEntry).serviceName || (<any> serviceEntry).name),
      category: serviceRepresentation.category || this.getDefaultServiceCategory(),
      serviceEntry: serviceEntry
    };
    this.services.push(ret);
    return ret;
  }

  /**
   * Get a service representation by entry string or class
   * @param lookingFor
   * @return {ServiceRepresentation}
   */
  getServiceByEntry (lookingFor): ServiceRepresentation {
    for(const service of this.services) {
      if(matchEntry(lookingFor, service.serviceEntry)) {
        return service;
      }
    }
    return null;
  }

  /**
   * Get services by category
   * @param {string} category
   * @return {ServiceRepresentation[]}
   */
  getServicesByCategory(category: string): ServiceRepresentation[] {
    const serviceFullSet = this.uniqServices;
    const retSet = [];
    for (const service of serviceFullSet) {
      if (service.category === category || category === 'all'
        || service.category === 'all' || service.category === 'weak-all') {
        const serviceEntry = (<any> service.serviceEntry).getLazyClass ?
          (<any> service.serviceEntry).getLazyClass() : service.serviceEntry;

        // Sucks code below, just unique the dependencies array...
        service.dependencies = <string[]> [...new Set((serviceEntry.dependencies || []).concat(service.dependencies || []))];

        retSet.push(service);
      }
    }
    return retSet;
  }

  /**
   * Inject applet class
   * @param {AppletRepresentation} appletRepresentation
   * @return {{appletName: string; category: (CategoryReg | any); appletEntry: EntryClass}}
   */
  injectApplet(appletRepresentation) {
    const appletEntry = this.normalizeEntry(appletRepresentation.appletEntry);
    const ret = {
      ...appletRepresentation,
      appletName: this.normalizeName(appletRepresentation.appletName || (<any> appletEntry).lazyName
        || (<any> appletEntry).appletName || (<any> appletEntry).name),
      category: appletRepresentation.category || this.getDefaultAppletCategory(),
      appletEntry
    };
    this.applets.push(ret);
    return ret;
  }

  /**
   * Get a applet representation by entry string or class
   * @param lookingFor
   * @return {ApplicationRepresentation}
   */
  getAppletByEntry (lookingFor): AppletRepresentation {
    for(const applet of this.applets) {
      if(matchEntry(lookingFor, applet.appletEntry)) {
        return applet;
      }
    }
    return null;
  }

  /**
   * Get applets by category
   * @param {string} category
   * @return {AppletRepresentation[]}
   */
  getAppletsByCategory(category: string): AppletRepresentation[] {
    const appletFullSet = this.uniqApplets;
    const retSet = [];
    for (const applet of appletFullSet) {
      if (applet.category === category || category === 'all'
        || applet.category === 'all' || applet.category === 'weak-all') {
        retSet.push(applet);
      }
    }
    return retSet;
  }

  protected getAvailableProcessMap () {

    const availableProcessMap = {};

    /**
     * Allocate applets
     */
    for (const applet of this.getAppletsByCategory('all')) {
      if(applet.category === 'all') {
        return foundAll;
      }
      if (applet.category === 'weak-all') {
        continue;
      }
      const process = this.getProcessByName(applet.category);
      if (!process) {
        throw new Error(`Can't allocate applet ${applet.appletName} at category ${applet.category} to any process.`);
      }
      availableProcessMap[applet.category] = true;
    }

    /**
     * Allocate services
     */
    for (const service of this.getServicesByCategory('all')) {
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


  /**
   * Get the application's structure
   * @returns {ApplicationStructureRepresentation}
   */
  getApplicationStructure(): ApplicationStructureRepresentation {

    const availableProcessMap = this.getAvailableProcessMap();
    const processRepresentations: ProcessRepresentation[] = [];

    for(const process of this.processes) {
      if(
        process.mode === 'profile.js' &&
        foundAll === availableProcessMap || availableProcessMap.hasOwnProperty(process.processName)
      ) {
        processRepresentations.push(process);
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
        mount.push(process);
      }
    }

    return { mount };
  }

  public static echoComplex(appRepresentation: ApplicationRepresentation) {
    const procfileReconciler = new ProcfileReconciler(appRepresentation);
    procfileReconciler.discover();
    const complex = procfileReconciler.getComplexApplicationStructureRepresentation();
    console.log(JSON.stringify(complex, null, 2));
  }

  public static async getComplexViaNewProcess(appRepresentation: ApplicationRepresentation): Promise<ComplexApplicationStructureRepresentation> {


    return <Promise<ComplexApplicationStructureRepresentation>> new Promise((resolve, reject) => {
      exec(`${process.execPath} ${/\.ts$/.test(__filename) ? '-r ts-node/register' : ''} -e 'require("${__filename}").ProcfileReconciler.echoComplex(${JSON.stringify(appRepresentation)})'`,
        (error, stdout) => {
          if(error) {
            reject(error);
            return;
          }
          try {
            const complex: ComplexApplicationStructureRepresentation = JSON.parse(stdout.toString());
            resolve(complex);
          } catch (err) {
            reject(err);
          }
        });
    });
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

function matchEntry(userLooking: any, entry: any) {
  return !!(userLooking === entry || userLooking === entry.lazyEntryMadeBy);
}
