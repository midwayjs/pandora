/**
 * A proxy (or called accessor) of the WorkerContext, to provide a grace interface to use
 */
import {WorkerContext} from './WorkerContext';
import {Environment} from 'pandora-env';
import {Service} from '../domain';
import {Facade as HubFacade} from 'pandora-hub';
import {DefaultObjectProxy, ObjectDescription} from 'pandora-hub';

/**
 * Class WorkerContextAccessor
 * A easy way to access WorkerContext
 */
export class WorkerContextAccessor {

  /**
   * Original context object
   */
  context: WorkerContext;

  /**
   * @param context - Original context object
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Current application name
   * @returns {string}
   */
  get appName(): string {
    return this.context.processRepresentation.appName;
  }

  /**
   * Current application directory path
   * @returns {string}
   */
  get appDir(): string {
    return this.context.processRepresentation.appDir;
  }

  /**
   * Current process name, such as worker, background
   * @returns {string}
   */
  get processName(): string {
    return this.context.processRepresentation.processName;
  }

  /**
   * Current environment identical string, such as production, development
   * @returns {string}
   */
  get env(): string {
    return this.context.getEnvironment().get('env');
  }

  /**
   * Environment object, that should injected by procfile.js or globalConfig
   * @returns {Environment}
   */
  get environment(): Environment {
    return this.context.getEnvironment();
  }

  /**
   * Get service instance by service's name
   * @param {string} name - Name of service
   * @returns {Service}
   */
  getService<T extends Service>(name: string): T {
    return this.context.serviceReconciler.get(name);
  }

  /**
   * Get a service class by service's name
   * @param {string} name - Name of service
   * @returns {class}
   */
  getServiceClass(name: string) {
    return this.context.serviceReconciler.getServiceClass(name);
  }

  getHub(): HubFacade {
    return this.context.getIPCHub();
  }

  async getProxy <T extends any> (name: string): Promise<T & DefaultObjectProxy>;
  async getProxy <T extends any> (objectDescription: ObjectDescription): Promise<T & DefaultObjectProxy>;
  async getProxy(target: string | ObjectDescription): Promise<any> {
    let objDesc = null;
    if(typeof target === 'string') {
      objDesc = {
        name: target
      };
    } else {
      objDesc = target;
    }
    const hub = this.context.getIPCHub();
    return hub.getProxy(objDesc);
  }

  async publishObject(name: string, obj): Promise<void>;
  async publishObject(objectDescription: ObjectDescription, obj): Promise<void>;
  async publishObject(target: string | ObjectDescription, obj): Promise<void> {
    let objDesc = null;
    if(typeof target === 'string') {
      objDesc = {
        name: target
      };
    } else {
      objDesc = target;
    }
    const hub = this.context.getIPCHub();
    return hub.publish(objDesc, obj);
  }

}
