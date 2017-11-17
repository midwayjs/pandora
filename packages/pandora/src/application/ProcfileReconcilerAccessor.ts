import {ProcfileReconciler} from './ProcfileReconciler';
import {CategoryReg, Entry} from '../domain';
import {AppletRepresentationChainModifier} from './AppletRepresentationChainModifier';
import {ServiceRepresentationChainModifier} from './ServiceRepresentationChainModifier';
import {ProcessRepresentationChainModifier} from './ProcessRepresentationChainModifier';
import {makeRequire} from 'pandora-dollar';

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

  defaultAppletCategory(name: CategoryReg) {
    this.procfileReconciler.setDefaultAppletCategory(name);
  }

  defaultServiceCategory(name: CategoryReg) {
    this.procfileReconciler.setDefaultServiceCategory(name);
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
   * define process
   * @param processName
   * @return {ProcessRepresentationChainModifier}
   */
  process(processName): ProcessRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getProcessByName(processName);
    if(this.procfileReconciler.getProcessByName(processName)) {
      return new ProcessRepresentationChainModifier(savedRepresentation);
    }
    const representation = this.procfileReconciler.defineProcess({processName});
    return new ProcessRepresentationChainModifier(representation);
  }

  /**
   * Define fork a process
   * @param entryFile
   * @param processName
   * @return {ProcessRepresentationChainModifier}
   */
  fork(entryFile, processName): ProcessRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getProcessByName(processName);
    if(savedRepresentation) {
      return new ProcessRepresentationChainModifier(savedRepresentation);
    }
    const representation = this.procfileReconciler.defineProcess({
      entryFile,
      processName,
      mode: 'fork'
    });
    return new ProcessRepresentationChainModifier(representation);
  }

  /**
   * Inject applet class
   * @param appletEntry
   * @return {AppletRepresentationChainModifier}
   */
  applet(appletEntry): AppletRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getAppletByEntry(appletEntry);
    if(savedRepresentation) {
      return new AppletRepresentationChainModifier(savedRepresentation);
    }
    const representation = this.procfileReconciler.injectApplet({appletEntry});
    return new AppletRepresentationChainModifier(representation);
  }

  /**
   * Inject service class
   * @param serviceEntry
   * @return {ServiceRepresentationChainModifier}
   */
  service(serviceEntry): ServiceRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getServiceByEntry(serviceEntry);
    if(savedRepresentation) {
      return new ServiceRepresentationChainModifier(savedRepresentation);
    }
    const representation = this.procfileReconciler.injectService({serviceEntry});
    return new ServiceRepresentationChainModifier(representation);
  }

  /**
   * An alias to applet()
   * @param path
   * @return {AppletRepresentationChainModifier}
   */
  cluster(path): AppletRepresentationChainModifier {

    const baseDir = this.procfileReconciler.procfileBasePath;

    class ClusterApplet {
      async start() {
        if(baseDir) {
          makeRequire(baseDir)(path);
        } else {
          require(path);
        }
      }
    }

    return this.applet(ClusterApplet);

  }

}
