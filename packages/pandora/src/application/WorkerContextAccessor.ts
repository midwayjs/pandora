/**
 * A proxy (or called accessor) of the WorkerContext, to provide a grace interface to use
 */
import {WorkerContext} from './WorkerContext';
import {Environment} from 'pandora-env/src/domain';
import {Applet, Configurator, Service} from '../domain';

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
   * Properties from configurator.getProperties(), that should injected by procfile.js or globalConfig
   * @returns {any}
   */
  get config(): any {
    return this.context.getProperties();
  }

  /**
   * Configurator object, that should injected by procfile.js or globalConfig
   * @returns {Configurator}
   */
  get configurator(): Configurator {
    return this.context.getConfigurator();
  }

  /**
   * Environment object, that should injected by procfile.js or globalConfig
   * @returns {Environment}
   */
  get environment(): Environment {
    return this.context.getEnvironment();
  }

  /**
   * Get applet by applet's name
   * @param {string} name - Name of applet
   * @returns {Applet}
   */
  getApplet<T extends Applet>(name: string): T {
    return this.context.appletReconciler.getAppletInstance(name);
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

}
