import {Daemon} from 'pandora';
import {MetricsManager} from '../common/MetricsManager';
const assert = require('assert');

export class MetricsInjectionBridge {

  static daemon: Daemon = null;
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

  static setDaemon(daemon: Daemon) {
    this.daemon = daemon;
  }

  static getDaemon() {
    return this.daemon;
  }

}
