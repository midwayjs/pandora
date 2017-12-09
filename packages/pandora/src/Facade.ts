import delegate = require('delegates');
import {WorkerContextAccessor} from './application/WorkerContextAccessor';

export class Facade {
  constructor() {
    delegate(this, 'workerContext')
      .access('appName')
      .access('appDir')
      .access('processName')
      .access('env')
      .access('environment')
      .access('hub')
      .method('getService')
      .method('getServiceClass')
      .method('getHub')
      .method('publishObject')
      .method('getProxy');
  }
  get workerContext(): WorkerContextAccessor {
    return Facade.get('workerContext');
  }
  appName: typeof WorkerContextAccessor.prototype.appName;
  appDir: typeof WorkerContextAccessor.prototype.appDir;
  processName: typeof WorkerContextAccessor.prototype.processName;
  env: typeof WorkerContextAccessor.prototype.env;
  environment: typeof WorkerContextAccessor.prototype.environment;
  getService: typeof WorkerContextAccessor.prototype.getService;
  getServiceClass: typeof WorkerContextAccessor.prototype.getServiceClass;
  getHub: typeof WorkerContextAccessor.prototype.getHub;
  publishObject: typeof WorkerContextAccessor.prototype.publishObject;
  getProxy: typeof WorkerContextAccessor.prototype.getProxy;

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
