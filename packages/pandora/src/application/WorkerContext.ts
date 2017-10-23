'use strict';
import {
  ProcessRepresentation, AppletRepresentation,
  ServiceRepresentation, Configurator
} from '../domain';
import {AppletReconciler} from './AppletReconciler';
import {ServiceReconciler} from '../service/ServiceReconciler';
import {EnvironmentUtil, Environment} from 'pandora-env';
import {WorkerContextAccessor} from './WorkerContextAccessor';

/**
 * Class WorkerContext
 *  1. Inject the service and the applet
 *  2. manage the process's lifecycle, provide start() and stop()
 *  3. drive the lifecycle of the service and the applet
 */
export class WorkerContext {

  private configurator: Configurator;
  public processRepresentation: ProcessRepresentation;
  public serviceReconciler: ServiceReconciler;
  public appletReconciler: AppletReconciler;
  public workerContextAccessor: WorkerContextAccessor;

  private configProperties: any;

  constructor(processRepresentation: ProcessRepresentation) {
    this.processRepresentation = processRepresentation;
    this.appletReconciler = new AppletReconciler(processRepresentation, this);
    this.serviceReconciler = new ServiceReconciler(processRepresentation, this);
    this.workerContextAccessor = new WorkerContextAccessor(this);
  }

  /**
   * Get environment object
   * @returns {Environment}
   */
  getEnvironment(): Environment {
    return EnvironmentUtil.getInstance().getCurrentEnvironment();
  }

  /**
   * Set configurator object
   * @param configurator
   * @returns {Promise<void>}
   */
  async setConfigurator(configurator) {
    this.configurator = configurator;
    this.configProperties = await this.configurator.getAllProperties();
  }

  /**
   * Get properties from configurator object
   * @returns {any}
   */
  getProperties(): any {
    return this.configProperties;
  }

  /**
   * Get configurator object
   * @returns {Configurator}
   */
  getConfigurator(): Configurator {
    return this.configurator;
  }

  /**
   * Bind services
   * @param {ServiceRepresentation | ServiceRepresentation[]} services
   */
  bindService(services: ServiceRepresentation | ServiceRepresentation[]) {
    if (Array.isArray(services)) {
      for (const service of services) {
        this.serviceReconciler.receiveServiceRepresentation(service);
      }
      return;
    }
    this.serviceReconciler.receiveServiceRepresentation(services);
  }

  /**
   * Bind applets
   * @param {AppletRepresentation | AppletRepresentation[]} applets
   */
  bindApplet(applets: AppletRepresentation | AppletRepresentation[]) {
    if (Array.isArray(applets)) {
      for (const applet of applets) {
        this.appletReconciler.receiveAppletRepresentation(applet);
      }
      return;
    }
    this.appletReconciler.receiveAppletRepresentation(applets);
  }

  /**
   * Start worker, drive the lifecycle of the service and the applet
   * @returns {Promise<void>}
   */
  async start() {
    await this.serviceReconciler.start();
    await this.appletReconciler.start();
  }

  /**
   * Stop worker, drive the lifecycle of the service and the applet
   * @returns {Promise<void>}
   */
  async stop() {
    await this.serviceReconciler.stop();
    await this.appletReconciler.stop();
  }
}

