import {ApplicationRepresentation} from '../domain';
import {ProcfileReconciler} from './ProcfileReconciler';
import assert = require('assert');
import {ProcfileReconcilerAccessor} from './ProcfileReconcilerAccessor';

/**
 * Class ClusterSupport
 */
export class ClusterSupport {
  /**
   * Make a shim procfile.js when start mode be cluster, to support the start mode cluster
   * @param {ApplicationRepresentation} appRepresentation
   * @param {ProcfileReconciler} procfileReconciler
   */
  static attachShimProcfile(appRepresentation: ApplicationRepresentation, procfileReconciler: ProcfileReconciler) {
    assert(appRepresentation.mode === 'cluster', 'Only mode === cluster can call static method attachShimProcfile()');
    procfileReconciler.callProcfile((pandora: ProcfileReconcilerAccessor) => {
      class UserEntryWrapper {
        async start() {
          require(appRepresentation.entryFile);
        }
      }
      pandora.process('worker').scale(appRepresentation.scale);
      pandora.applet(UserEntryWrapper).process('worker');
    });

  }
}