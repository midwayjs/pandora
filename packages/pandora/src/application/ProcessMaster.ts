'use strict';
import {ApplicationRepresentation, ApplicationStructureRepresentation, ProcessRepresentation} from '../domain';
import cluster = require('cluster');
import {cpus} from 'os';
import {format} from 'util';
import * as $ from 'pandora-dollar';
import Base = require('sdk-base');
import {consoleLogger} from '../universal/LoggerBroker';
import {ProcfileReconciler} from './ProcfileReconciler';
import {
  READY, WORKER_READY, APP_START_SUCCESS, RELOAD, SHUTDOWN, WORKER_EXIT, ERROR,
  RELOAD_SUCCESS, RELOAD_ERROR, SHUTDOWN_TIMEOUT, FINISH_SHUTDOWN
} from '../const';

const cFork = require('../../3rd/fork');
const PathWorkerProcessBootstrap = require.resolve('./WorkerProcessBootstrap');
const $ProcessName = Symbol('ProcessName');

export const defaultWorkerCount = process.env.DEFAULT_WORKER_COUNT ? parseInt(process.env.DEFAULT_WORKER_COUNT) : cpus().length;

/**
 * Class Master
 */
export class ProcessMaster extends Base {
  public started: boolean = false;
  private workers: Map<any, any> = new Map();
  private appRepresentation: ApplicationRepresentation = null;
  private procfileReconciler: ProcfileReconciler = null;

  private get workersSet() {
    const workers = [];
    for (let [key, value] of this.workers) {
      workers.push({
        pid: key,
        spawnargs: value.process.spawnargs,
        name: value[$ProcessName],
      });
    }
    return workers;
  }

  constructor(appRepresentation: ApplicationRepresentation) {
    super();
    this.appRepresentation = appRepresentation;
    this.procfileReconciler = new ProcfileReconciler(appRepresentation);
  }

  /**
   * Get all the workers
   * @return {Array}
   */
  getWorkers() {
    return this.workersSet;
  }

  /**
   * Start master
   * @return {Promise<void>}
   */
  async start() {

    const {mode} = this.appRepresentation;

    if ('procfile.js' === mode) {
      this.procfileReconciler.discover();
    }

    if (!this.procfileReconciler.getComplexApplicationStructureRepresentation().mount.length) {
      throw new Error(`Can't get any process at ${this.appRepresentation.appDir}`);
    }

    // Pass appId to child process through process.env
    process.env.appId = process.pid;

    // Listen the events of the cluster
    this.listenEvents();

    // Start process
    const appStructRepresent: ApplicationStructureRepresentation = this.procfileReconciler.getApplicationStructure();
    const {process: processRepresentSet} = appStructRepresent;
    for (const processRepresent of processRepresentSet) {
      await this.forkWorker({
        ...this.appRepresentation,
        ...processRepresent
      });
    }

    // Mark self started
    this.started = true;

    // Notify all workers the application successful started
    this.notify(APP_START_SUCCESS, {workers: this.workersSet});
  }

  /**
   * Stop master, stop all workers
   * @return {Promise<void>}
   */
  async stop() {
    for(const id of Object.keys(cluster.workers)) {
      const worker = cluster.workers[id];
      (<any> worker)._refork = false;
    }
    this.notify(SHUTDOWN, {});
    await $.promise.delay(3000);
    await Promise.all(Object.keys(cluster.workers).map(async (id) => {
      const worker = cluster.workers[id];
      await this.killWorkerSop(worker);
    }));
    this.started = false;
  }

  /**
   * Reload all workers
   * @param targetName
   * @return {Promise<void>}
   */
  public async reload(targetName?) {
    /*
     * The main logic is
     * 1. Send a shutdown message to workers, the workers will to do some processing after receive that message
     * 2. Refork the worker after receive reply message or timeout
     * @param name {string} appName
     * @return {Promise}
     */
    const workers = {};
    for (let pid of this.workers.keys()) {
      const worker = this.workers.get(pid);
      const name = worker[$ProcessName];
      if (!workers[name]) {
        workers[name] = [];
      }
      workers[name].push(worker);
    }
    if (workers[targetName]) {
      await this.reloadNamedWorkers(workers[targetName]);
      return;
    }
    const appStructRepresent: ApplicationStructureRepresentation =
      this.procfileReconciler.getApplicationStructure();
    const {process: processRepresentSet} = appStructRepresent;
    for (const processRepresent of processRepresentSet) {
      await this.reloadNamedWorkers(workers[processRepresent.processName]);
    }

  }

  /**
   * Realod named workers
   * @param workers
   * @return {Promise<void>}
   */
  private async reloadNamedWorkers(workers) {
    const r = [];
    for (let worker of workers) {
      r.push(this.reloadWorker(worker));
    }
    await Promise.all(r);
  }

  /**
   * Reload a worker
   * @param worker
   * @return {Promise<any>}
   */
  private reloadWorker(worker): Promise<any> {
    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        resolve();
      }, SHUTDOWN_TIMEOUT);
      // Mark it doesn't want to refork by 3rd lib cfork
      worker._refork = false;
      worker.send({action: SHUTDOWN});
      worker.on('message', message => {
        if (message.action === FINISH_SHUTDOWN) {
          clearTimeout(timer);
          timer = null;
          resolve();
        }
      });
    }).then(() => {
      return new Promise((resolve) => {
        let setting = worker._clusterSettings;
        if (setting) {
          cluster.settings = setting;
          cluster.setupMaster();
        }
        const newWorker: any = cluster.fork();
        newWorker.once('online', () => {
          newWorker[$ProcessName] = worker[$ProcessName];
          this.workers.set(newWorker.process.pid, newWorker);
          // Long living server connections may block workers from disconnecting
          resolve(this.killWorkerSop(worker));
        });
        newWorker._clusterSettings = setting;
      });
    });
  }

  /**
   * Kill a worker by in a SOP way
   * @param worker
   * @return {Promise<void>}
   */
  async killWorkerSop(worker) {
    if (worker.isDead()) {
      return;
    }
    worker.disconnect();
    await $.promise.delay(2000);
    worker.kill();
    await $.promise.delay(2000);
    if (worker.isDead()) {
      return;
    }
    worker.kill('SIGKILL');
    await $.promise.delay(2000);
  }


  /**
   * Send message to all the workers
   * @param action
   * @param data
   */
  notify(action, data) {
    for (let pid of this.workers.keys()) {
      const worker = this.workers.get(pid);
      if (worker.isConnected()) {
        worker.send({action, data});
      }
    }
  }

  /**
   * Fork a new worker, keep that live
   * @param {ProcessRepresentation} processRepresentation
   * @return {Promise<any>}
   */
  private forkWorker(processRepresentation: ProcessRepresentation): Promise<any> {

    const workerArgs = ['--params', JSON.stringify(processRepresentation)];
    const count = processRepresentation.scale === 'auto' ? defaultWorkerCount : (processRepresentation.scale || defaultWorkerCount);
    const execArgv = process.execArgv.concat(processRepresentation.argv || []);

    // Handing TypeScript, only for unit test
    if (/\.ts$/.test(module.filename) && execArgv.indexOf('ts-node/register') === -1) {
      execArgv.push('-r', 'ts-node/register', '-r', 'nyc-ts-patch');
    }

    cFork({
      env: processRepresentation.env,
      exec: PathWorkerProcessBootstrap,
      execArgv,
      args: workerArgs,
      silent: false,
      count: count,
      // TODO: Set the refork to be false in the local environment, it will not restart child process that exited by exception. It's easy to find bugs.
      refork: true
    });

    let successCount = 0;
    return new Promise((resolve, reject) => {

      const onFork = (worker) => {
        worker.once('message', (message) => {
          const action = message && message.action;
          if (action === READY) {
            successCount++;
            worker[$ProcessName] = processRepresentation.processName;
            this.workers.set(worker.process.pid, worker);
            // All process started successfully
            if (successCount === count) {
              cluster.removeListener('exit', onExit);
              cluster.removeListener('fork', onFork);
              resolve();
            }
          } else if (action === ERROR) {
            const message = format(
              'web-worker#%s:%s start error (exitedAfterDisconnect: %s, state: %s), current workers: %j',
              worker.id, worker.process.pid,
              worker.exitedAfterDisconnect, worker.state,
              Object.keys(cluster.workers)
            );
            const err = new Error(message);
            reject(err);
          }
        });
      };

      const onExit = (worker, code, signal) => {
        worker._refork = false;
        worker.removeAllListeners('message');
        const workerProcess = worker.process;
        const exitCode = workerProcess.exitCode;
        const message = format(
          'web-worker#%s:%s died (code: %s, signal: %s, exitedAfterDisconnect: %s, state: %s), current workers: %j',
          worker.id, worker.process.pid, exitCode, signal,
          worker.exitedAfterDisconnect, worker.state,
          Object.keys(cluster.workers)
        );
        const err = new Error(message);
        err.name = 'WebWorkerDiedError';
        reject(err);
      };

      cluster.on('fork', onFork);
      cluster.once('exit', onExit);

    });
  }

  /**
   * Listen the events of the cluster when the master start
   */
  private listenEvents() {
    cluster.on('exit', this.onWorkerDie.bind(this));
    cluster.on('fork', this.onClusterFork.bind(this));
    process.on('message', this.onProcessMessage.bind(this));
    process.once('SIGQUIT', this.onProcessTerm.bind(this, 'SIGQUIT'));
    process.once('SIGTERM', this.onProcessTerm.bind(this, 'SIGTERM'));
    process.once('SIGINT', this.onProcessTerm.bind(this, 'SIGINT'));
  }

  /**
   * Handing the process term signal
   * @param sig
   */
  onProcessTerm(sig) {
    consoleLogger.info(`Application's master receive a signal ${sig}, exit with code 0, pid ${process.pid}`);
    this.stop().then(() => {
      process.exit(0);
    }).catch((err) => {
      consoleLogger.error(err);
      process.exit(1);
    });
  }

  /**
   * Handing the process message
   * @param message
   */
  onProcessMessage(message) {
    if (message.action === RELOAD) {
      this.reload(message.name).then(() => {
        if (process.send) {
          process.send({action: RELOAD_SUCCESS});
        }
      }).catch((err) => {
        consoleLogger.error(err);
        if (process.send) {
          process.send({action: RELOAD_ERROR});
        }
      });
    }
  }

  onClusterFork(worker) {
    // Send a message to other workers when a new worker online
    worker.once('message', (message) => {
      process.nextTick(() => {
        const action = message && message.action;
        if (action === READY) {
          const pid = worker.process.pid;
          this.notify(WORKER_READY, {
            pid: String(pid),
            name: worker[$ProcessName],
          });
        }
      });
    });
  }

  onWorkerDie(worker, code, signal) {
    // After a worker died, notify MessengerServer to remove connection of that worker
    const pid = worker.process.pid;
    this.workers.delete(pid);
    // Tell other workers that worker died
    this.notify(WORKER_EXIT, {
      code,
      signal,
      pid: String(pid),
      name: worker[$ProcessName],
    });
  }
}

export default (appRepresentation: ApplicationRepresentation, done) => {
  const master = new ProcessMaster(appRepresentation);
  master.start().then(() => {
    done();
  }).catch(err => {
    done(err);
  });
};
