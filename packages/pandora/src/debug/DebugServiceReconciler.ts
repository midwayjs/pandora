'use strict';
import {ServiceReconciler} from '../service/ServiceReconciler';
import {WorkerContext} from '../application/WorkerContext';

/**
 * Class DebugServiceReconciler
 * For Debugging Service
 */
export class DebugServiceReconciler extends ServiceReconciler {
  constructor(mode?) {
    mode = mode || null;
    const processName = mode || 'worker';
    const process = {
      processName: processName,
      appName: 'pandora-debug',
      appDir: '/pandora-debug'
    };
    super(process, new WorkerContext(process), mode);
  }

  receiveServiceRepresentation(rep) {
    if (rep.serviceEntry.dependencies && !rep.dependencies) {
      rep.dependencies = rep.serviceEntry.dependencies;
    }
    super.receiveServiceRepresentation(rep);
  }
}
