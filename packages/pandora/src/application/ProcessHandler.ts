'use strict';
import {ChildProcess, fork} from 'child_process';
import {
  RELOAD, RELOAD_SUCCESS, RELOAD_ERROR, PANDORA_CWD,
  State, PROCESS_READY, PROCESS_ERROR, RELOAD_TIMEOUT, SHUTDOWN_TIMEOUT
} from '../const';
import {getDaemonLogger, createAppLogger, getAppLogPath, removeEOL} from '../universal/LoggerBroker';
import {ProcessRepresentation} from '../domain';
import {ILogger} from 'pandora-service-logger/src/domain';

const pathProcessBootstrap = require.resolve('./ProcessBootstrap');

/**
 * Class ApplicationHandler
 */
export class ProcessHandler {
  public state: State;
  public processRepresentation: ProcessRepresentation;
  private nodejsStdout: ILogger;
  private daemonLogger: ILogger;
  private forkedProcess: ChildProcess;

  public get appName() {
    return this.processRepresentation.appName;
  }

  public get processName() {
    return this.processRepresentation.processName;
  }

  public get appDir() {
    return this.processRepresentation.appDir;
  }

  public get pid() {
    return this.forkedProcess && this.forkedProcess.pid;
  }

  public startCount: number = 0;

  // TODO: make nodejsStdout is required
  constructor(processRepresentation: ProcessRepresentation, nodejsStdout?) {

    this.state = State.pending;
    this.processRepresentation = processRepresentation;

    this.daemonLogger = getDaemonLogger();
    this.nodejsStdout = nodejsStdout || createAppLogger(processRepresentation.appName, 'nodejs_stdout');

  }

  /**
   * Start application through fork
   * @return {Promise<void>}
   */
  async start(): Promise<void> {

    const args = ['--params', JSON.stringify(this.processRepresentation)];
    this.startCount++;

    await this.doFork(args);

  }

  protected doFork(args): Promise<void> {

    const nodejsStdout = this.nodejsStdout;
    const daemonLogger = this.daemonLogger;
    const representation = this.processRepresentation;

    const execArgv: any = process.execArgv.slice(0);

    // Handing typeScript file，just for testing
    if (/\.ts$/.test(module.filename) && execArgv.indexOf('ts-node/register') === -1) {
      execArgv.push('-r', 'ts-node/register', '-r', 'nyc-ts-patch');
    }

    const userArgv = (<ProcessRepresentation> representation).argv;
    if(userArgv && userArgv.length) {
      execArgv.push.apply(execArgv, userArgv);
    }

    const env = {
      ...process.env,
      ...representation.env,
      [PANDORA_CWD]: process.cwd(),
      // require.main === module maybe be 'false' after patched spawn wrap in mocha ??? not very sure, but keep it for safe
      RUN_PROCESS_BOOTSTRAP_BY_FORCE: true
    };

    return new Promise((resolve, reject) => {

      // Fork it
      const forkedProcess = fork(pathProcessBootstrap, args, <any> {
        cwd: representation.appDir,
        execArgv,
        stdio: ['ipc', 'pipe', 'pipe'],
        env
      });

      forkedProcess.once('message', (message) => {

        if (message.action === PROCESS_READY) {

          const msg = `Application [appName = ${representation.appName}, processName = ${representation.processName || 'null'}, dir = ${this.appDir}, pid = ${forkedProcess.pid}] started successfully!`;
          this.state = State.complete;
          daemonLogger.info(msg);
          nodejsStdout.info(msg);
          resolve();

        } else if (message.action === PROCESS_ERROR) {

          this.stop().catch((err) => {
            const msg = `Application [name = ${representation.appName}, dir = ${this.appDir}, pid = ${forkedProcess.pid}] start error!`;
            daemonLogger.error(err);
            nodejsStdout.error(err);
            daemonLogger.error(msg);
            nodejsStdout.error(msg);
            reject(new Error(msg));
          });

        }

      });

      // TODO: Enhance performance, get FD to write Buffer directly
      forkedProcess.stdout.on('data', (data) => {
        nodejsStdout.write(removeEOL(data.toString()));
      });
      forkedProcess.stderr.on('data', (err) => {
        nodejsStdout.write(removeEOL(err.toString()));
      });

      // Here just to distinguish normal exits and exceptional exits, exceptional exits need to restart
      forkedProcess.once('exit', (code, signal) => {

        const msg = `Application [name = ${this.processRepresentation.appName}, dir = ${this.appDir}, pid = ${forkedProcess.pid}] exit with code ${code} and signal ${signal}`;
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
            const err = new Error('Start failed, log file: ' + getAppLogPath(this.appName, 'nodejs_stdout'));
            reject(err);
            break;
        }

      });

      this.forkedProcess = forkedProcess;

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
      let resolved = false;
      this.forkedProcess.once('exit', () => {
        this.forkedProcess = null;
        resolved = true;
        resolve();
      });
      setTimeout(() => {
        if(!resolved) {
          this.forkedProcess.kill('SIGKILL');
        }
        resolve();
      }, SHUTDOWN_TIMEOUT);
      this.forkedProcess.kill('SIGTERM');
    });

  }

  /**
   * Reload application through process message
   * @param processName
   * @return {Promise<void>}
   */
  reload(processName?): Promise<void> {

    if(processName !== this.processName && processName != null) {
      return;
    }

    if(this.processRepresentation.scale === 1) {
      return this.stop().then(this.start.bind(this));
    }

    return new Promise((resolve, reject) => {
      this.forkedProcess.once('message', (message) => {
        if (message.action === RELOAD_SUCCESS) {
          resolve();
        }
        if (message.action === RELOAD_ERROR) {
          reject(message.error);
        }
      });
      this.forkedProcess.send({
        action: RELOAD,
        name: processName,
      });
      setTimeout(() => {
        reject(new Error('Reload Timeout'));
      }, RELOAD_TIMEOUT);
    });

  }
}
