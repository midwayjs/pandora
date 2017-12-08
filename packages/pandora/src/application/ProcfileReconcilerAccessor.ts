import {ProcfileReconciler} from './ProcfileReconciler';
import {CategoryReg, Entry} from '../domain';
import {ServiceRepresentationChainModifier} from './ServiceRepresentationChainModifier';
import {ProcessRepresentationChainModifier} from './ProcessRepresentationChainModifier';
import {makeRequire} from 'pandora-dollar';
import {ServiceUtils} from '../service/ServiceUtils';

/**
 * Class ProcfileReconcilerAccessor
 * A easy way to access ProcfileReconciler
 */
export class ProcfileReconcilerAccessor {

  private procfileReconciler: ProcfileReconciler = null;

  get dev() {
    return process.env.PANDORA_DEV === 'true';
  }

  get appName() {
    return this.procfileReconciler.appRepresentation.appName;
  }

  get appDir() {
    return this.procfileReconciler.appRepresentation.appDir;
  }

  constructor(procfileReconciler: ProcfileReconciler) {
    this.procfileReconciler = procfileReconciler;
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
   * define process
   * @param processName
   * @return {ProcessRepresentationChainModifier}
   */
  process(processName: string): ProcessRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getProcessByName(processName);
    if(this.procfileReconciler.getProcessByName(processName)) {
      return new ProcessRepresentationChainModifier(savedRepresentation, this.procfileReconciler);
    }
    const representation = this.procfileReconciler.defineProcess({
      processName
    });
    return new ProcessRepresentationChainModifier(representation, this.procfileReconciler);
  }

  /**
   * Define fork a process
   * @param processName
   * @param entryFile
   * @return {ProcessRepresentationChainModifier}
   */
  fork(processName: string, entryFile): ProcessRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getProcessByName(processName);
    if(savedRepresentation) {
      return new ProcessRepresentationChainModifier(savedRepresentation, this.procfileReconciler);
    }
    const representation = this.procfileReconciler.defineProcess({
      entryFile,
      processName
    });
    return new ProcessRepresentationChainModifier(representation, this.procfileReconciler);
  }

  /**
   * Inject service class
   * @param serviceName
   * @param serviceEntry
   * @return {ServiceRepresentationChainModifier}
   */
  service(serviceName: string, serviceEntry): ServiceRepresentationChainModifier {
    ServiceUtils.checkName(serviceName);
    const savedRepresentation = this.procfileReconciler.getServiceByName(serviceName);
    if(savedRepresentation && serviceEntry) {
      throw new Error(`Service already exist! Use pandora.service('${serviceName}').entry('a new place') to change the entry.`);
    }
    if(savedRepresentation) {
      return new ServiceRepresentationChainModifier(savedRepresentation, this.procfileReconciler);
    }
    const representation = this.procfileReconciler.injectService({
      serviceName, serviceEntry
    });
    return new ServiceRepresentationChainModifier(representation, this.procfileReconciler);
  }

  private clusterCount = 0;

  /**
   * An alias to service()
   * @param path
   * @return {ServiceRepresentationChainModifier}
   */
  cluster(path): ServiceRepresentationChainModifier {
    const baseDir = this.procfileReconciler.procfileBasePath;
    class ClusterService {
      static dependencies = ['all'];
      async start() {
        if(baseDir) {
          makeRequire(baseDir)(path);
        } else {
          require(path);
        }
      }
    }
    return this.service('cluster' + this.clusterCount++, ClusterService);
  }

}
