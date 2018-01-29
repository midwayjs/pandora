import {MetricsManager} from '../common/MetricsManager';
import {Facade} from 'pandora-hub';
const assert = require('assert');

export class MetricsInjectionBridge {

  // FIXME: import {Daemon} from 'pandora'; will occurs a cycle deps
  static daemon: any = null;
  static ipcHub: Facade = null;
  static metricsManager;

  static getMetricsManager(): MetricsManager {
    if(!this.metricsManager) {
      assert('please set metrics server before use it');
    }
    return this.metricsManager;
  }

  static setMetricsManager(metricsServer: MetricsManager) {
    this.metricsManager = metricsServer;
  }

  static setDaemon(daemon) {
    this.daemon = daemon;
  }

  static getDaemon() {
    return this.daemon;
  }

  static setIPCHub(ipcHub: Facade) {
    this.ipcHub = ipcHub;
  }

  static getIPCHub() {
    return this.ipcHub;
  }

}
