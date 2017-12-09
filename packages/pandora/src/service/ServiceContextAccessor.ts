import {ServiceCore} from './ServiceCore';
import {WorkerContextAccessor} from '../application/WorkerContextAccessor';
import delegate = require('delegates');

export class ServiceContextAccessor {
  serviceCore: ServiceCore;
  workerContext: WorkerContextAccessor;

  constructor(serviceCore: ServiceCore) {
    this.serviceCore = serviceCore;
    this.workerContext = serviceCore.context;

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

    delegate(this, 'serviceCore')
      .access('logger')
      .access('dependencies')
      .access('representation')
      .access('serviceName')
      .access('config')
      .method('publish')
      .method('getDependency');
  }

  // WorkerContextAccessor
  appName: typeof WorkerContextAccessor.prototype.appName;
  appDir: typeof WorkerContextAccessor.prototype.appDir;
  processName: typeof WorkerContextAccessor.prototype.processName;
  env: typeof WorkerContextAccessor.prototype.env;
  environment: typeof WorkerContextAccessor.prototype.environment;
  getService: typeof WorkerContextAccessor.prototype.getService;
  getServiceClass: typeof WorkerContextAccessor.prototype.getServiceClass;
  getHub: typeof WorkerContextAccessor.prototype.getHub;
  getProxy: typeof WorkerContextAccessor.prototype.getProxy;
  publishObject: typeof WorkerContextAccessor.prototype.publishObject;

  // ServiceCore
  logger: typeof ServiceCore.prototype.logger;
  dependencies: typeof ServiceCore.prototype.dependencies;
  representation: typeof ServiceCore.prototype.representation;
  serviceName: typeof ServiceCore.prototype.serviceName;
  config: typeof ServiceCore.prototype.config;
  publish: typeof ServiceCore.prototype.publish;
  getDependency: typeof ServiceCore.prototype.getDependency;

}