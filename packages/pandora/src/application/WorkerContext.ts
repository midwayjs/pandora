'use strict';
import {
  ProcessRepresentation,
  ServiceRepresentation
} from '../domain';
import {ServiceReconciler} from '../service/ServiceReconciler';
import {EnvironmentUtil, Environment} from 'pandora-env';
import {WorkerContextAccessor} from './WorkerContextAccessor';

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
    await this.serviceReconciler.start();
  }

  /**
   * Stop worker, drive the lifecycle of the service
   * @returns {Promise<void>}
   */
  async stop() {
    await this.serviceReconciler.stop();
  }
}

