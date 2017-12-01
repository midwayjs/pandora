'use strict';
import {ServiceOptions, ServiceRepresentation} from '../domain';
import ServiceLogger from './ServiceLogger';
import {Service} from '../domain';
import {WorkerContextAccessor} from '../application/WorkerContextAccessor';
import {SERVICE_PREFIX_IN_HUB} from '../const';
import {ServiceContextAccessor} from './ServiceContextAccessor';

/**
 * Class SimpleServiceCore
 */
export class ServiceCore {

  protected ImplClass;
  protected impl: Service;
  protected options: ServiceOptions;

  constructor(options: ServiceOptions, ImplClass) {
    this.options = options;
    this.ImplClass = ImplClass;
  };

  _logger: ServiceLogger;
  get logger() {
    if(!this._logger) {
      this._logger = new ServiceLogger(this);
    }
    return this._logger;

  }

  get context(): WorkerContextAccessor {
    return this.options.context;
  }

  private _dependencies;
  get dependencies() {
    if(this._dependencies) {
      return this._dependencies;
    }
    const ret = {};
    for (const id in this.options.depInstances) {
      if (this.options.depInstances.hasOwnProperty(id)) {
        ret[id] = this.options.depInstances[id].getService();
      }
    }
    this._dependencies = ret;
    return ret;
  }

  get representation(): ServiceRepresentation {
    return this.options.representation;
  }

  get serviceName() {
    return this.representation.serviceName;
  }

  get config() {
    return this.representation.config || {};
  }

  /**
   * Get Class of implementation
   * @return {any}
   */
  protected getImplClass() {
    return this.ImplClass;
  }

  /**
   * Instantiate service
   * @return {Service}
   */
  instantiate() {
    if (!this.impl) {
      const serviceContextAccessor = new ServiceContextAccessor(this);
      const Klass = this.getImplClass();
      this.impl = new (Klass)(serviceContextAccessor);
    }
    return this.impl;
  }

  /**
   * Start service
   * @return {Promise<void>}
   */
  async start() {
    const impl = this.instantiate();
    impl.start && await impl.start();
  }

  /**
   * Stop service
   * @return {Promise<void>}
   */
  async stop() {
    this.impl.stop && await this.impl.stop();
  }

  /**
   * Publish this service to IPC HUB
   * @return {Promise<void>}
   */
  async publish(): Promise<void> {
    const objectNameInHub = SERVICE_PREFIX_IN_HUB + this.getServiceId();
    await this.context.hub.publish(this.impl, {
      name: objectNameInHub
    });
  }

  /**
   * Get service's implementation object
   * @return {Service}
   */
  getService(): Service {
    return this.impl;
  }

  /**
   * Get service's identify, equal service's name now
   * @return {string}
   */
  public getServiceId() {
    return this.serviceName;
  }

  /**
   * Get a dependency service's implementation object by service's ID (name)
   * @param name
   * @return {any}
   */
  public getDependency(name) {
    return this.dependencies[name];
  }

}
