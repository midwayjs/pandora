'use strict';
import {fork} from 'child_process';
import Base = require('sdk-base');
import {
  MASTER, APP_START_SUCCESS, APP_START_ERROR, RELOAD, RELOAD_SUCCESS, RELOAD_ERROR, PANDORA_CWD,
  State
} from '../const';
import {existsSync} from 'fs';
import assert = require('assert');
import {getDaemonLogger, createAppLogger, getAppLogPath, removeEOL} from '../universal/LoggerBroker';
import {ApplicationRepresentation} from '../domain';
import {SpawnWrapperUtils} from '../daemon/SpawnWrapperUtils';

const pathProcessMaster = require.resolve('./ProcessMaster');
const pathProcessBootstrap = require.resolve('./ProcessBootstrap');
const daemonLogger = getDaemonLogger();

/**
 * Class ApplicationHandler
 */
export class ApplicationHandler extends Base {
  public state: State;
  public appRepresentation: any;
  private nodejsStdout: any;
  private proc: any;

  public get name() {
    return this.appRepresentation.appName;
  }

  public get appDir() {
    return this.appRepresentation.appDir;
  }

  public get mode() {
    return this.appRepresentation.mode;
  }

  public get pid() {
    return this.proc && this.proc.pid;
  }

  constructor(applicationRepresentation: ApplicationRepresentation) {

    super();
    this.state = State.pending;
    this.appRepresentation = applicationRepresentation;
    assert(existsSync(this.appDir), `AppDir ${this.appDir} does not exist`);

    this.nodejsStdout = createAppLogger(applicationRepresentation.appName, 'nodejs_stdout');

  }

  /**
   * Start application through fork
   * @return {Promise<void>}
   */
  async start(): Promise<void> {

    const {mode, entryFile} = this.appRepresentation;
    const args = [];

    if ('procfile.js' === mode || 'cluster' === mode) {
      args.push('--entry', pathProcessMaster);
      args.push('--params', JSON.stringify(Object.assign({name: MASTER}, this.appRepresentation)));
    } else if ('fork' === mode) {
      args.push('--entry', entryFile);
      args.push('--params', JSON.stringify(Object.assign({name: MASTER}, this.appRepresentation)));
    } else {
      throw new Error(`Unknown start mode ${mode} when start an application`);
    }

    if('fork' === mode) {
      // Only mode be fork, that will with spawn wrapper transaction
      await SpawnWrapperUtils.transaction(this.doFork.bind(this, args));
    } else {
      await this.doFork(args);
    }

  }

  protected doFork(args): Promise<void> {

    const nodejsStdout = this.nodejsStdout;

    const execArgv: any = process.execArgv.slice(0);
    // Handing typeScript file，just for testing
    if (/\.ts$/.test(module.filename) && execArgv.indexOf('ts-node/register') === -1) {
      execArgv.push('-r', 'ts-node/register', '-r', 'nyc-ts-patch');
    }

    const env = {
      ...process.env,
      [PANDORA_CWD]: process.cwd(),
      // require.main === module maybe be 'false' after patched spawn wrap
      RUN_PROCESS_BOOTSTRAP_BY_FORCE: true
    };

    return new Promise((resolve, reject) => {

      // Fork it
      const proc = fork(pathProcessBootstrap, args, <any> {
        cwd: this.appRepresentation.appDir,
        execArgv,
        stdio: ['ipc', 'pipe', 'pipe'],
        env
      });

      proc.once('message', (message) => {
        if (message.action === APP_START_SUCCESS) {
          const msg = `Application [name = ${this.appRepresentation.appName}, dir = ${this.appDir}, pid = ${proc.pid}] started successfully!`;
          daemonLogger.info(msg);
          nodejsStdout.info(msg);
          this.state = State.complete;
          resolve();
        } else if (message.action === APP_START_ERROR) {
          this.stop().catch((err) => {
            daemonLogger.error(err);
            nodejsStdout.error(err);
          }).then(() => {
            reject(new Error(`Application [name = ${this.appRepresentation.appName}, dir = ${this.appDir}, pid = ${proc.pid}] start error!`));
          });
        }
      });

      proc.stdout.on('data', (data) => {
        nodejsStdout.write(removeEOL(data.toString()));
      });

      proc.stderr.on('data', (err) => {
        nodejsStdout.write(removeEOL(err.toString()));
      });

      // Here just to distinguish normal exits and exceptional exits, exceptional exits needs to restart
      proc.once('exit', (code, signal) => {
        const msg = `Application [name = ${this.appRepresentation.appName}, dir = ${this.appDir}, pid = ${proc.pid}] exit with code ${code} and signal ${signal}`;
        daemonLogger.info(msg);
        nodejsStdout.info(msg);
        switch (this.state) {
          case State.complete:
            // Restart it automatically when it exceptional exits after it start successful
            this.start().catch(err => {
              daemonLogger.error('Restart application error');
              nodejsStdout.error('Restart application error');
              daemonLogger.error(err);
              nodejsStdout.error(err);
            });
            break;
          case State.pending:
          default:
            const err = new Error('Start failed, log file: ' + getAppLogPath(this.name, 'nodejs_stdout'));
            reject(err);
            break;
        }
      });

      this.proc = proc;
    });

  }


  /**
   * Stop application through kill
   * @return {Promise<void>}
   */
  stop(): Promise<void> {
    if (this.state === State.stopped) {
      return Promise.resolve();
    }
    this.state = State.stopped;
    return new Promise((resolve) => {
      this.proc.once('exit', () => {
        this.proc = null;
        resolve();
      });
      this.proc.kill('SIGTERM');
    });
  }

  /**
   * Reload application through process message
   * @param processName
   * @return {Promise<void>}
   */
  reload(processName?): Promise<void> {
    return new Promise((resolve, reject) => {
      this.proc.once('message', (message) => {
        if (message.action === RELOAD_SUCCESS) {
          resolve();
        }
        if (message.action === RELOAD_ERROR) {
          reject();
        }
      });
      this.proc.send({
        action: RELOAD,
        name: processName,
      });
    });
  }
}
