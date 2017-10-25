'use strict';
import {makeRequire, resolveSymlink} from 'pandora-dollar';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {
  Entry, EntryClass, AppletRepresentation, ApplicationRepresentation, ApplicationStructureRepresentation
  , ProcessRepresentation, ServiceRepresentation
} from '../domain';
import assert = require('assert');
import {join, dirname, basename, extname} from 'path';
import {existsSync} from 'fs';
import {PROCFILE_NAMES} from '../const';
import {consoleLogger} from '../universal/LoggerBroker';
import {ProcfileReconcilerAccessor} from './ProcfileReconcilerAccessor';

/**
 * Class ProcfileReconciler
 * TODO: Add more description
 */
export class ProcfileReconciler {

  public appRepresentation: ApplicationRepresentation = null;
  private discovered = false;
  private configuratorClass: EntryClass = null;
  private environmentClass: EntryClass = null;
  private service: Array<ServiceRepresentation> = [];
  private applet: Array<AppletRepresentation> = [];
  private procfileBasePath: string = null;
  private procfileReconcilerAccessor: ProcfileReconcilerAccessor = null;

  private get uniqService(): Array<ServiceRepresentation> {
    const nameMap: Map<string, boolean> = new Map;
    const ret = [];
    for (const service of this.service.reverse()) {
      if (!nameMap.has(service.serviceName)) {
        nameMap.set(service.serviceName, true);
        ret.push(service);
      }
    }
    return ret.reverse();
  }

  private get uniqApplet(): Array<AppletRepresentation> {
    const nameMap: Map<string, boolean> = new Map;
    const ret = [];
    for (const applet of this.applet.reverse()) {
      if (!nameMap.has(applet.appletName)) {
        nameMap.set(applet.appletName, true);
        ret.push(applet);
      }
    }
    return ret.reverse();
  }

  private get defaultAppletCategory() {
    const {process} = GlobalConfigProcessor.getInstance().getAllProperties();
    if (process && process.defaultCategory) {
      return process.defaultCategory;
    }
    throw Error('Should set process.defaultCategory in Pandora\'s GlobalConfig.');
  }

  private get defaultServiceCategory() {
    const {service} = GlobalConfigProcessor.getInstance().getAllProperties();
    if (service && service.defaultCategory) {
      return service.defaultCategory;
    }
    throw Error('Should set service.defaultCategory in Pandora\'s GlobalConfig.');
  }

  private get globalProcessConfig() {
    const {process} = GlobalConfigProcessor.getInstance().getAllProperties();
    if (process) {
      return process;
    }
    throw Error('Should set service.process in Pandora\'s GlobalConfig.');
  }

  protected get globalServiceInjection() {
    const {service} = GlobalConfigProcessor.getInstance().getAllProperties();
    if (service && service.injection) {
      return service.injection;
    }
    return [];
  }

  private get appDir() {
    assert(
      this.appRepresentation && this.appRepresentation.appDir,
      'Cant\'t get appDir from ProcfileReconciler.appRepresentation, that should passed from constructing ProcfileReconciler.'
    );
    return this.appRepresentation.appDir;
  }

  constructor(appRepresentation: ApplicationRepresentation) {
    this.appRepresentation = appRepresentation;
    this.procfileReconcilerAccessor = new ProcfileReconcilerAccessor(this);

    // Get services from globalConfig
    for (const serviceName of Object.keys(this.globalServiceInjection)) {
      const certainServiceSetting = this.globalServiceInjection[serviceName];
      if (typeof certainServiceSetting === 'function' || typeof certainServiceSetting === 'string') {
        this.procfileReconcilerAccessor.service(certainServiceSetting).name(serviceName);
      } else {
        this.procfileReconcilerAccessor.service(certainServiceSetting.entry)
          .name(serviceName).config(certainServiceSetting.config);
      }
    }
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
    // return name.replace(/^[A-Z]/, (x) => x.toLocaleLowerCase());
  }

  /**
   * Inject configurator class
   * @param {Entry} entry
   */
  injectConfigurator(entry: Entry) {
    this.configuratorClass = this.normalizeEntry(entry);
  }

  /**
   * Inject environment class
   * @param {Entry} entry
   */
  injectEnvironment(entry: Entry) {
    this.environmentClass = this.normalizeEntry(entry);
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
      category: serviceRepresentation.category || this.defaultServiceCategory,
      serviceEntry: serviceEntry
    };
    this.service.push(ret);
    return ret;
  }

  /**
   * Inject applet class
   * @param {AppletRepresentation} appletRepresentation
   * @return {{appletName: string; category: (CategoryReg | any); appletEntry: EntryClass}}
   */
  injectApplet(appletRepresentation: AppletRepresentation) {
    const appletEntry = this.normalizeEntry(appletRepresentation.appletEntry);
    const ret = {
      ...appletRepresentation,
      appletName: this.normalizeName(appletRepresentation.appletName || (<any> appletEntry).lazyName || (<any> appletEntry).appletName || (<any> appletEntry).name),
      category: appletRepresentation.category || this.defaultAppletCategory,
      appletEntry
    };
    this.applet.push(ret);
    return ret;
  }

  /**
   * Get configurator class
   * @return {EntryClass}
   */
  getConfigurator(): EntryClass {
    const {configurator: configuratorClassGlobal} = GlobalConfigProcessor.getInstance().getAllProperties();
    if (this.configuratorClass) {
      return this.configuratorClass;
    }
    if (configuratorClassGlobal) {
      return configuratorClassGlobal;
    }
    throw new Error('Should ProcfileReconciler.injectConfigurator() before ProcfileReconciler.getConfigurator().');
  }

  /**
   * Get environment class
   * @return {EntryClass}
   */
  getEnvironment(): EntryClass {
    const {environment: environmentClassGlobal} = GlobalConfigProcessor.getInstance().getAllProperties();
    if (this.environmentClass) {
      return this.environmentClass;
    }
    if (environmentClassGlobal) {
      return environmentClassGlobal;
    }
    throw new Error('Should ProcfileReconciler.injectEnvironment() before ProcfileReconciler.getEnvironment().');
  }

  /**
   * Get applets by category
   * @param {string} category
   * @return {AppletRepresentation[]}
   */
  getAppletsByCategory(category: string): AppletRepresentation[] {
    const appletFullSet = this.uniqApplet;
    const retSet = [];
    for (const applet of appletFullSet) {
      if (applet.category === category || category === 'all' || applet.category === 'all') {
        retSet.push(applet);
      }
    }
    return retSet;
  }

  /**
   * Get services by category
   * @param {string} category
   * @return {ServiceRepresentation[]}
   */
  getServicesByCategory(category: string): ServiceRepresentation[] {
    const serviceFullSet = this.uniqService;
    const retSet = [];
    for (const service of serviceFullSet) {
      if (service.category === category || category === 'all' || service.category === 'all') {
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
   * Get process define by processName
   * TODO: Make a clone
   * @param processNmae
   * @return {any | string}
   */
  getProcess(processNmae) {
    return this.globalProcessConfig.category[processNmae];
  }

  /**
   * Get application's structure
   * @returns {ApplicationStructureRepresentation}
   */
  getApplicationStructureRepresentation(): ApplicationStructureRepresentation {

    const processConfig = this.globalProcessConfig;
    const availableProcessMap = {};
    /**
     * Get applets
     */
    for (const applet of this.getAppletsByCategory('all')) {
      if (applet.category === 'all') {
        continue;
      }
      if (!processConfig.category.hasOwnProperty(applet.category)) {
        throw new Error(`Can't allocate applet ${applet.appletName} at category ${applet.category} to any process.`);
      }
      availableProcessMap[applet.category] = processConfig.category[applet.category];
    }

    const processRepresentationSet: ProcessRepresentation[] = [];
    for (const processName of Object.keys(availableProcessMap)) {
      const certainProcessConfig = availableProcessMap[processName];
      processRepresentationSet.push({
        processName,
        ...certainProcessConfig
      });
    }
    const processRepresentationSet2nd = processRepresentationSet.sort((a, b) => {
      return a.order - b.order;
    });
    return {
      process: processRepresentationSet2nd
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
