import {ServiceCore} from './ServiceCore';
import {ProcessContextAccessor} from '../application/ProcessContextAccessor';
import delegate = require('delegates');

export class ServiceContextAccessor {
  serviceCore: ServiceCore;
  processContext: ProcessContextAccessor;

  constructor(serviceCore: ServiceCore) {
    this.serviceCore = serviceCore;
    this.processContext = serviceCore.context;

    delegate(this, 'processContext')
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

  // ProcessContextAccessor
  appName: typeof ProcessContextAccessor.prototype.appName;
  appDir: typeof ProcessContextAccessor.prototype.appDir;
  processName: typeof ProcessContextAccessor.prototype.processName;
  env: typeof ProcessContextAccessor.prototype.env;
  environment: typeof ProcessContextAccessor.prototype.environment;
  getService: typeof ProcessContextAccessor.prototype.getService;
  getServiceClass: typeof ProcessContextAccessor.prototype.getServiceClass;
  getHub: typeof ProcessContextAccessor.prototype.getHub;
  getProxy: typeof ProcessContextAccessor.prototype.getProxy;
  publishObject: typeof ProcessContextAccessor.prototype.publishObject;

  // ServiceCore
  logger: typeof ServiceCore.prototype.logger;
  dependencies: typeof ServiceCore.prototype.dependencies;
  representation: typeof ServiceCore.prototype.representation;
  serviceName: typeof ServiceCore.prototype.serviceName;
  config: typeof ServiceCore.prototype.config;
  publish: typeof ServiceCore.prototype.publish;
  getDependency: typeof ServiceCore.prototype.getDependency;

}