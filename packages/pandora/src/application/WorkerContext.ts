'use strict';
import {
  ProcessRepresentation,
  ServiceRepresentation
} from '../domain';
import {ServiceReconciler} from '../service/ServiceReconciler';
import {EnvironmentUtil, Environment} from 'pandora-env';
import {WorkerContextAccessor} from './WorkerContextAccessor';
import {Facade as HubFacade} from 'pandora-hub';
import {consoleLogger} from '../universal/LoggerBroker';

/**
 * Class WorkerContext
 *  1. Inject the service
 *  2. manage the process's lifecycle, provide start() and stop()
 *  3. drive the lifecycle of the service
 */
export class WorkerContext {

  public processRepresentation: ProcessRepresentation;
  public serviceReconciler: ServiceReconciler;
  public workerContextAccessor: WorkerContextAccessor;
  private ipcHub: HubFacade;

  constructor(processRepresentation: ProcessRepresentation) {
    this.processRepresentation = processRepresentation;
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

  getIPCHub() {
    if(!this.ipcHub) {
      this.ipcHub = new HubFacade();
      this.ipcHub.setup({
        location: {
          appName: this.processRepresentation.appName,
          processName: this.processRepresentation.processName,
          pid: process.pid.toString()
        },
        logger: consoleLogger
      });

    }
   return this.ipcHub;
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
   * Start worker, drive the lifecycle of the service
   * @returns {Promise<void>}
   */
  async start() {
    await this.getIPCHub().start();
    await this.serviceReconciler.start();
  }

  /**
   * Stop worker, drive the lifecycle of the service
   * @returns {Promise<void>}
   */
  async stop() {
    await this.getIPCHub().stop();
    await this.serviceReconciler.stop();
  }
}

