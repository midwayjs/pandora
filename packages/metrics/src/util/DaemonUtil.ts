import {Daemon} from 'pandora';

export class DaemonUtil {

  static daemon: Daemon = null;

  static setDaemon(daemon: Daemon) {
    this.daemon = daemon;
  }

  static getDaemon() {
    return this.daemon;
  }

}