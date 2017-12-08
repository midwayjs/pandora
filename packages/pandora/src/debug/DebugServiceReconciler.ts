'use strict';
import {ServiceReconciler} from '../service/ServiceReconciler';
import {ProcessContext} from '../application/ProcessContext';

/**
 * Class DebugServiceReconciler
 * For Debugging Service
 */
export class DebugServiceReconciler extends ServiceReconciler {
  constructor(processName) {
    const process = {
      processName: processName || 'worker',
      appName: 'pandora-debug',
      appDir: '/pandora-debug'
    };
    super(process, new ProcessContext(process));
  }
  receiveServiceRepresentation(rep) {
    if (rep.serviceEntry.dependencies && !rep.dependencies) {
      rep.dependencies = rep.serviceEntry.dependencies;
    }
    super.receiveServiceRepresentation(rep);
  }
}
