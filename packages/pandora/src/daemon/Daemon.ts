'use strict';
import {ComplexHandler} from './ComplexHandler';
import Base = require('sdk-base');
import {DAEMON_MESSENGER, SEND_DAEMON_MESSAGE} from '../const';
import * as fs from 'fs';
import assert = require('assert');
import messenger from 'pandora-messenger';
import {getDaemonLogger, getAppLogPath} from '../universal/LoggerBroker';
import {ApplicationRepresentation} from '../domain';
import {Monitor} from './Monitor';

const daemonLogger = getDaemonLogger();

enum State {
  pending = 1,
  complete,
  stopped,
}

/**
 * Class Daemon
 */
export class Daemon extends Base {
  private state: State;
  private apps: Map<any, ComplexHandler>;
  private messengerServer: any;
  private monitor: Monitor;

  constructor() {
    super();
    this.state = State.pending;
    this.apps = new Map();
  }

  /**
   * Start Daemon
   * @return {Promise<any>}
   */
  async start() {
    if(this.state === State.complete) {
      return;
    }
    return new Promise((resolve, reject) => {
      this.messengerServer = messenger.getServer({
        name: DAEMON_MESSENGER,
      });
      this.messengerServer.on(SEND_DAEMON_MESSAGE, (message, reply) => {
        this.handleCommand(message, reply);
      });
      this.messengerServer.ready(() => {
        return this.startMonitor().then(() => {
          this.state = State.complete;
          this.ready(true);
          resolve();
        }).catch(err => {
          daemonLogger.error(err);
          process.exit(1);
          reject(err);
        });
      });
      this.handleExit();
    });
  }

  /**
   * Handing all passive exit events, such as process signal, uncaughtException
   */
  handleExit() {
    process.on('uncaughtException', (err) => {
      daemonLogger.error(err);
      this.stop();
    });
    // SIGTERM AND SIGINT will trigger the exit event.
    ['SIGQUIT', 'SIGTERM', 'SIGINT'].forEach(sig => {
      process.once(sig, () => {
        this.stop();
      });
    });

    process.once('exit', () => {
      this.stop();
    });
  }

  /**
   * Handle daemon's command invocations
   * @param message
   * @param reply
   */
  handleCommand(message, reply) {
    const command = message.command;
    const args = message.args;

    switch (command) {
      case 'start':
        this.startApp(args).then(() => {
          reply({data: `${args.appName} started successfully! log file: ${getAppLogPath(args.appName, 'nodejs_stdout')}`});
        }).catch(err => {
          reply({error: `${args.appName} started failed, ${err && err.toString()}`});
        });
        break;
      case 'stopAll':
        this.stopAllApps().then(() => {
          reply({data: `all apps stopped successfully!`});
        }).catch(err => {
          reply({error: `all apps stopped failed, ${err && err.toString()}`});
        });
        break;
      case 'stopApp':
        this.stopApp(args.appName).then(() => {
          reply({data: `${args.appName} stopped successfully!`});
        }).catch(err => {
          reply({error: `${args.appName} stopped failed, ${err && err.toString()}`});
        });
        break;
      case 'restart':
        this.stopApp(args.appName).then(diedApp => {
          return this.startApp(diedApp.appRepresentation);
        }).then(() => {
          reply({data: `${args.appName} restarted successfully!`});
        }).catch(err => {
          reply({error: `${args.appName} restarted failed, ${err && err.toString()}`});
        });
        break;

      case 'exit':
        this.stop().then(() => {
          process.exit(0);
        });
        break;

      case 'list':
        const keySet = Array.from(this.apps.keys());
        const data = keySet.map((key) => {
          const complex = this.apps.get(key);
          return {
            name: complex.name,
            appId: complex.appId,
            pids: complex.pids,
            mode: complex.mode,
            appDir: complex.appDir,
            state: complex.state
          };
        });
        reply({data: data});
        break;
    }

  }

  /**
   * Start an application
   *
   * @param {ApplicationRepresentation} applicationRepresentation
   * @returns {Promise<ComplexHandler>}
   */
  async startApp(applicationRepresentation: ApplicationRepresentation): Promise<ComplexHandler> {
    // require appName and appDir when app start
    const appName = applicationRepresentation.appName;
    const appDir = applicationRepresentation.appDir;
    assert(appName, `options.appName is required!`);
    assert(appDir, `options.appDir is required!`);
    assert(fs.existsSync(appDir), `${appDir} does not exists!`);
    assert(!this.apps.has(appName), `app[${appName}]  has been initialized!`);
    const complexHandler = new ComplexHandler(applicationRepresentation);
    await complexHandler.start();
    this.apps.set(appName, complexHandler);
    return complexHandler;
  }

  /**
   * Reload an application
   * @param appName
   * @param processName
   * @return {Promise<ComplexHandler>}
   */
  async reloadApp(appName, processName?): Promise<ComplexHandler> {
    const complex = this.apps.get(appName);
    if (!complex) {
      throw new Error(`${appName} does not exists!`);
    }
    await complex.reload(processName);
    return complex;
  }

  /**
   * stop an application
   * @param appName
   * @return {Promise<ComplexHandler>}
   */
  async stopApp(appName): Promise<ComplexHandler> {
    const complex = this.apps.get(appName);
    if (!complex) {
      throw new Error(`${appName} does not exists!`);
    }
    await complex.stop();
    this.apps.delete(appName);
    return complex;
  }

  /**
   * stop all the applications
   * @return {Promise<void>}
   */
  async stopAllApps(): Promise<void> {
    for (const appName of this.apps.keys()) {
      await this.stopApp(appName);
    }
  }

  /**
   * stop an application
   * @return {Promise<void>}
   */
  async stop(): Promise<void> {
    this.state = State.stopped;
    await this.stopAllApps();
    daemonLogger.info('daemon is going to stop');
    this.messengerServer.close();
    await this.stopMonitor();
    this.state = State.stopped;
  }

  /**
   * Start the monitor
   * @return {Promise<void>}
   */
  private async startMonitor(): Promise<void> {
    if (!this.monitor) {
      this.monitor = new Monitor();
    }
    return this.monitor.start();
  }

  /**
   * Stop the monitor
   * @return {Promise<void>}
   */
  private async stopMonitor(): Promise<void> {
    if (this.monitor) {
      return this.monitor.stop();
    }
  }

}
