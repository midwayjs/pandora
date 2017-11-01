import {AppletRepresentation, ProcessRepresentation, Applet, AppletConstructor} from '../domain';
import {WorkerContext} from './WorkerContext';

/**
 * The reconciler of applet
 *   1. Inject the applets, and manage them
 *   2. Resolve the applet's config
 *   3. Instantiate the applet and drive it's lifecycle
 */
export class AppletReconciler {

  protected processRepresentation: ProcessRepresentation;
  private appletSet: Array<AppletRepresentation> = [];
  private instanceMap: Map<AppletRepresentation, Applet> = new Map;
  private context: WorkerContext;

  /**
   * @param {ProcessRepresentation} processRepresentation - ProcessRepresentation object
   * @param {WorkerContext} context - WorkerContext object
   */
  constructor(processRepresentation: ProcessRepresentation, context: WorkerContext) {
    this.processRepresentation = processRepresentation;
    this.context = context;
  }

  /**
   * Receive an applet by AppletRepresentation
   * @param {AppletRepresentation} applet - AppletRepresentation object
   * @returns {void}
   */
  receiveAppletRepresentation(applet: AppletRepresentation): void {
    this.appletSet.push(applet);
    // Midway 5 有需求，在 Service 启动阶段中访问未启动 Applet，预先实例化一下
    this.getAppletInstance(applet);
  }

  /**
   * Get an AppletRepresentation object by certain applet's name
   * @param name - Name of applet
   * @returns {AppletRepresentation}
   */
  private getRepresentationByAppletName(name): AppletRepresentation {
    for (const applet of this.appletSet) {
      if (applet.appletName === name) {
        return applet;
      }
    }
    return null;
  }

  /**
   * Get an instance of applet
   * @param {AppletRepresentation | string} represent - AppletRepresentation or applet's name
   * @return {Applet}
   */
  getAppletInstance<T extends Applet>(represent: AppletRepresentation | string): T {
    if (typeof represent === 'string') {
      represent = this.getRepresentationByAppletName(represent);
    }
    if(!represent) {
      return null;
    }
    if (!this.instanceMap.has(represent)) {
      represent.config = represent.configResolver ?
        represent.configResolver(this.context.workerContextAccessor, represent.config) : represent.config;
      const Entry = <AppletConstructor> represent.appletEntry;
      const applet = new Entry({
        appletName: represent.appletName,
        category: represent.category,
        config: represent.config,
        context: this.context.workerContextAccessor
      });
      this.instanceMap.set(represent, applet);
    }
    return <T> this.instanceMap.get(represent);
  }

  /**
   * Start all the applets
   * @return {Promise<void>}
   */
  async start() {
    for (const represent of this.appletSet) {
      const inst = this.getAppletInstance(represent);
      inst.start && await inst.start();
    }
  }

  /**
   * Stop all the applets
   * @return {Promise<void>}
   */
  async stop() {
    for (const represent of this.appletSet) {
      const inst = this.getAppletInstance(represent);
      inst.stop && await inst.stop();
    }
  }

}
