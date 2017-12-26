'use strict';
import {ApplicationHandler} from '../application/ApplicationHandler';
import Base = require('sdk-base');
import {DAEMON_MESSENGER, SEND_DAEMON_MESSAGE, State} from '../const';
import * as fs from 'fs';
import assert = require('assert');
import messenger from 'pandora-messenger';
import {getDaemonLogger} from '../universal/LoggerBroker';
import {ApplicationRepresentation} from '../domain';
import {Monitor} from '../monitor/Monitor';
import {DaemonIntrospection} from './DaemonIntrospection';

/**
 * Class Daemon
 */
export class Daemon extends Base {

  private messengerServer: any;
  private monitor: Monitor;
  private introspection: DaemonIntrospection;
  private daemonLogger = getDaemonLogger();

  public state: State;
  public apps: Map<any, ApplicationHandler>;

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
          this.daemonLogger.error(err);
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
      this.daemonLogger.error(err);
      this.stop();
    });
    // SIGTERM AND SIGINT will trigger the exit event.
    ['SIGQUIT', 'SIGTERM', 'SIGINT'].forEach( (sig: NodeJS.Signals) => {
      process.once(sig, () => {
        this.stop();
      });
    });

    process.once('exit', () => {
      this.stop();
    });
  }


  /**
   * Start an application
   *
   * @param {ApplicationRepresentation} applicationRepresentation
   * @returns {Promise<ApplicationHandler>}
   */
  async startApp(applicationRepresentation: ApplicationRepresentation): Promise<ApplicationHandler> {
    // require appName and appDir when app start
    const appName = applicationRepresentation.appName;
    const appDir = applicationRepresentation.appDir;
    assert(appName, `options.appName is required!`);
    assert(appDir, `options.appDir is required!`);
    assert(fs.existsSync(appDir), `${appDir} does not exists!`);
    assert(!this.apps.has(appName), `app[${appName}] has been initialized!`);
    const applicationHandler = new ApplicationHandler(applicationRepresentation);
    await applicationHandler.start();
    this.apps.set(appName, applicationHandler);
    return applicationHandler;
  }

  /**
   * Reload an application
   * @param appName
   * @param processName
   * @return {Promise<ApplicationHandler>}
   */
  async reloadApp(appName, processName?): Promise<ApplicationHandler> {
    const handler = this.apps.get(appName);
    if (!handler) {
      throw new Error(`${appName} does not exists!`);
    }
    await handler.reload(processName);
    return handler;
  }

  /**
   * stop an application
   * @param appName
   * @return {Promise<ApplicationHandler>}
   */
  async stopApp(appName): Promise<ApplicationHandler> {
    const handler = this.apps.get(appName);
    if (!handler) {
      throw new Error(`${appName} does not exists!`);
    }
    await handler.stop();
    this.apps.delete(appName);
    return handler;
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
    this.daemonLogger.info('daemon is going to stop');
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
          reply({data: `${args.appName} started successfully! Run command [ pandora log ${args.appName} ] to get more information`});
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
        const introspection = this.getIntrospection();
        return introspection.listApplication().then((data) => {
          reply({data});
        }).catch((error) => {
          reply({error});
        });
    }

  }

  public getIntrospection(): DaemonIntrospection {
    if(!this.introspection) {
      this.introspection = new DaemonIntrospection(this);
    }
    return this.introspection;
  }

}
