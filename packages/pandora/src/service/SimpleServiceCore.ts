'use strict';
import assert = require('assert');
import {ServiceOptions, ServiceRepresentation} from '../domain';
import {MessengerClient, MessengerServer} from 'pandora-messenger';
import ServiceLogger from './ServiceLogger';
import {Service} from '../domain';
import {WorkerContextAccessor} from '../application/WorkerContextAccessor';

const debug = require('debug')('pandora:SimpleServiceCore');

/**
 * Class SimpleServiceCore
 */
export class SimpleServiceCore {

  protected ImplClass;
  protected impl: Service;
  protected options: ServiceOptions;

  protected messengerClient: MessengerClient;
  protected messengerServer: MessengerServer;

  protected subscribeHandler: (name: string, listener: any) => Promise<any>;
  protected unsubscribeHandler: (name: string, listener?: any) => Promise<any>;

  public logger: ServiceLogger;

  get context(): WorkerContextAccessor {
    return this.options.context;
  }

  get workMode() {
    return this.options.workMode;
  }

  get deps() {
    const ret = {};
    for (const id in this.options.depInstances) {
      if (this.options.depInstances.hasOwnProperty(id)) {
        ret[id] = this.options.depInstances[id].getService();
      }
    }
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

  constructor(options: ServiceOptions, ImplClass) {
    this.options = options;
    this.ImplClass = ImplClass;
    this.messengerClient = options.messengerClient;
    this.messengerServer = options.messengerServer;
    this.logger = new ServiceLogger(this);
  };

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
      this.impl = new (this.getImplClass())(this);
      this.impl.core = this;
      if (this.impl.handleSubscribe) {
        this.subscribeHandler = <any> this.impl.handleSubscribe.bind(this.impl);
      }
      if (this.impl.handleUnsubscribe) {
        this.unsubscribeHandler = <any> this.impl.handleUnsubscribe.bind(this.impl);
      }
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
   * Invoke a method
   * @param {string} name
   * @param {any[]} args
   * @return {Promise<any>}
   */
  async invoke(name: string, args?: any[]): Promise<any> {
    args = args || [];
    debug('invoke() %s $s', name, args);
    const ret = this.impl[name].apply(this.impl, args);
    // May return this, that over ipc is meaningless.
    if (ret === this.impl) {
      return null;
    }
    if (ret instanceof Promise) {
      return await ret;
    } else {
      return ret;
    }
  }

  /**
   * Subscribe a event
   * @param reg
   * @param listener
   * @return {Promise<any>}
   */
  async subscribe(reg, listener) {
    assert(this.subscribeHandler, 'could not found subscribeHandler when subscribe event');
    debug('subscribe() %j', reg);
    return await this.subscribeHandler(reg, listener);
  }

  /**
   * Cancel subscribe a event
   * @param reg
   * @param listener
   * @return {Promise<any>}
   */
  async unsubscribe(reg, listener?) {
    assert(this.unsubscribeHandler, 'could not found unsubscribeHandler when unsubscribe event');
    debug('unsubscribe() %j', reg);
    return await this.unsubscribeHandler(reg, listener);
  }

  /**
   * Get MessengerClient
   * @return {MessengerClient}
   */
  getMessengerClient(): MessengerClient {
    return this.messengerClient;
  }

  /**
   * Get MessengerServer
   * @return {MessengerServer}
   */
  getMessengerServer(): MessengerServer {
    return this.messengerServer;
  }

  /**
   * Get service's implementation object
   * @return {Service}
   */
  getService(): Service {
    return this.impl;
  }

  /**
   * Generate service's identify, equal service's name now
   * @return {string}
   */
  public genServiceId() {
    return this.serviceName;
  }

  /**
   * Get a dependency service's implementation object by service's ID (name)
   * @param name
   * @return {any}
   */
  public getDependency(name) {
    return this.deps[name];
  }

}
