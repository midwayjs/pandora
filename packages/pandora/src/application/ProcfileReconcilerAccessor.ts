import {ProcfileReconciler} from './ProcfileReconciler';
import {ProcessRepresentationChainModifier} from './ProcessRepresentationChainModifier';

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

  /**
   * define process
   * @param processName
   * @return {ProcessRepresentationChainModifier}
   */
  process(processName: string): ProcessRepresentationChainModifier {
    const savedRepresentation = this.procfileReconciler.getProcessByName(processName);
    if(savedRepresentation) {
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
    const representation = this.procfileReconciler.defineProcess({
      entryFile,
      processName
    });
    return new ProcessRepresentationChainModifier(representation, this.procfileReconciler);
  }

  private clusterCount = 0;

  /**
   * @param path
   * @return {ProcessRepresentationChainModifier}
   */
  cluster(entryFile): ProcessRepresentationChainModifier;
  cluster(processName: string, entryFile): ProcessRepresentationChainModifier;
  cluster(a, b?): ProcessRepresentationChainModifier {
    const entryFile = (arguments.length === 1) ? a : b;
    const processName = (arguments.length === 1) ? 'cluster' + this.clusterCount++ : a;
    const representation = this.procfileReconciler.defineProcess({
      entryFile,
      processName,
      scale: 'auto'
    });
    return new ProcessRepresentationChainModifier(representation, this.procfileReconciler);
  }

}
