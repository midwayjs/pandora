import delegate = require('delegates');
import {ProcessContextAccessor} from './application/ProcessContextAccessor';

export class Facade {
  constructor() {
    delegate(this, 'processContext')
      .access('appName')
      .access('appDir')
      .access('processName')
      .access('env')
      .access('environment')
      .access('hub')
      .access('traceManager')
      .method('getService')
      .method('getServiceClass')
      .method('getHub')
      .method('publishObject')
      .method('getProxy');
  }
  get processContext(): ProcessContextAccessor {
    return Facade.get('processContext');
  }
  appName: typeof ProcessContextAccessor.prototype.appName;
  appDir: typeof ProcessContextAccessor.prototype.appDir;
  processName: typeof ProcessContextAccessor.prototype.processName;
  env: typeof ProcessContextAccessor.prototype.env;
  environment: typeof ProcessContextAccessor.prototype.environment;
  traceManager: typeof ProcessContextAccessor.prototype.traceManager;

  getService: typeof ProcessContextAccessor.prototype.getService;
  getServiceClass: typeof ProcessContextAccessor.prototype.getServiceClass;
  getHub: typeof ProcessContextAccessor.prototype.getHub;
  publishObject: typeof ProcessContextAccessor.prototype.publishObject;
  getProxy: typeof ProcessContextAccessor.prototype.getProxy;

  // TODO: Make Facade be a simple Injection temporarily. refactor it: Bring IOC into Pandora.js
  private static map: Map<string, any> = new Map();
  static set(k, v) {
    return Facade.map.set(k, v);
  }
  static get(k) {
    return Facade.map.get(k);
  }

  private static instance;
  static getInstance() {
    if(!Facade.instance) {
      Facade.instance = new Facade();
    }
    return Facade.instance;
  }
}
