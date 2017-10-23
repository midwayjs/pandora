import {ProcfileReconciler} from './ProcfileReconciler';
import {Entry} from '../domain';
import {AppletRepresentationChainModifier} from './AppletRepresentationChainModifier';
import {ServiceRepresentationChainModifier} from './ServiceRepresentationChainModifier';

/**
 * Class ProcfileReconcilerAccessor
 * A easy way to access ProcfileReconciler
 */
export class ProcfileReconcilerAccessor {

  private procfileReconciler: ProcfileReconciler = null;

  get appName() {
    return this.procfileReconciler.appRepresentation.appName;
  }

  get appDir() {
    return this.procfileReconciler.appRepresentation.appDir;
  }

  constructor(procfileReconciler: ProcfileReconciler) {
    this.procfileReconciler = procfileReconciler;
  }

  /**
   * Inject environment class
   * @param {Entry} entry
   */
  environment(entry: Entry) {
    this.procfileReconciler.injectEnvironment(entry);
  }

  /**
   * inject configurator class
   * @param {Entry} entry
   */
  configurator(entry: Entry) {
    this.procfileReconciler.injectConfigurator(entry);
  }

  /**
   * inject applet class
   * @param appletEntry
   * @return {AppletRepresentationChainModifier}
   */
  applet(appletEntry): AppletRepresentationChainModifier {
    const representation = this.procfileReconciler.injectApplet({appletEntry, appletName: null});
    return new AppletRepresentationChainModifier(representation);
  }

  /**
   * inject service class
   * @param serviceEntry
   * @return {ServiceRepresentationChainModifier}
   */
  service(serviceEntry): ServiceRepresentationChainModifier {
    const representation = this.procfileReconciler.injectService({serviceEntry});
    return new ServiceRepresentationChainModifier(representation);
  }

  /**
   * Get a process definition by processName
   * @param processName
   * @return {any | string}
   */
  getProcess(processName) {
    return this.procfileReconciler.getProcess(processName);
  }

}
