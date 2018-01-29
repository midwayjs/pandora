'use strict';
import {Daemon} from './Daemon';
import {DefaultEnvironment, EnvironmentUtil} from 'pandora-env';
import {DAEMON_READY, PANDORA_GLOBAL_CONFIG} from '../const';
import {MetricsConstants} from 'pandora-metrics';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {getDaemonLogger, getPandoraLogsDir} from '../universal/LoggerBroker';
import {MetricsInjectionBridge} from 'pandora-metrics';
import {Hub, Facade} from 'pandora-hub';

/**
 * Class DaemonBootstrap
 */
export class DaemonBootstrap {

  private daemonLogger = getDaemonLogger();
  private globalConfigProcessor = GlobalConfigProcessor.getInstance();
  private globalConfig = this.globalConfigProcessor.getAllProperties();
  private daemon: Daemon;
  private ipcHubServer: Hub;
  private ipcHub: Facade;

  /**
   * Start the daemon
   * @return {Promise<void>}
   */
  async start(): Promise<void> {

    try {

      const Environment = this.globalConfig.environment || DefaultEnvironment;

      // Register a default env for daemon process
      const daemonEnvironment = new Environment({
        processName: 'daemon',
        appName: MetricsConstants.METRICS_DEFAULT_APP,
        pandoraLogsDir: getPandoraLogsDir()
      });
      daemonEnvironment.set(PANDORA_GLOBAL_CONFIG, this.globalConfig);
      EnvironmentUtil.getInstance().setCurrentEnvironment(daemonEnvironment);


      this.ipcHubServer = new Hub();
      await this.ipcHubServer.start();

      this.ipcHub = new Facade();
      this.ipcHub.setup({
        location: {
          appName: '__pandora_daemon',
          processName: '__pandora_daemon',
          pid: process.pid.toString()
        },
        logger: this.daemonLogger
      });
      await this.ipcHub.start();
      MetricsInjectionBridge.setIPCHub(<any> this.ipcHub);

      this.daemon = new Daemon();
      await this.daemon.start();
      MetricsInjectionBridge.setDaemon(<any> this.daemon);


      if (process.send) {
        process.send(DAEMON_READY);
      }
    } catch (err) {
      this.daemonLogger.error(err);
      throw err;
    }

  }

  /**
   * Stop the Daemon
   * @return {Promise<void>}
   */
  async stop(): Promise<void> {
    await this.daemon.stop();
    await this.ipcHub.stop();
    await this.ipcHubServer.stop();
  }

}

export function cmd(): Promise<void> {
  const daemonBootstrap = new DaemonBootstrap;
  return daemonBootstrap.start().catch(() => {
    process.exit(1);
  });
}

if (require.main === module) {
  cmd();
}

