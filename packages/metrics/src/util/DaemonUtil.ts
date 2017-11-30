import {Daemon} from '../../../pandora/src/daemon/Daemon';

export class DaemonUtil {

  static daemon: Daemon = null;

  static setDaemon(daemon: Daemon) {
    this.daemon = daemon;
  }

  static getDaemon() {
    return this.daemon;
  }

}