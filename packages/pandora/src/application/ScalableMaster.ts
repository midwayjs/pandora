'use strict';
import {ProcessRepresentation} from '../domain';
import cluster = require('cluster');
import {format} from 'util';
import * as $ from 'pandora-dollar';
import {consoleLogger} from '../universal/LoggerBroker';
import {
  PROCESS_READY, WORKER_READY, RELOAD, SHUTDOWN, WORKER_EXIT, PROCESS_ERROR,
  RELOAD_SUCCESS, RELOAD_ERROR, SHUTDOWN_TIMEOUT, FINISH_SHUTDOWN, defaultWorkerCount
} from '../const';

const cFork = require('../../3rd/fork');
const pathToProcessBootstrap = require.resolve('./ProcessBootstrap');
const $ProcessName = Symbol('ProcessName');

/**
 * Class ScalableMaster
 * For kind of the process, that's field scale great than 1
 */
export class ScalableMaster {

  public started: boolean = false;
  private workers: Map<any, any> = new Map();
  private processRepresentation: ProcessRepresentation = null;

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

  constructor(processRepresentation: ProcessRepresentation) {
    this.processRepresentation = processRepresentation;
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

    // Listen the events of the module cluster
    this.listenEvents();

    // Start to cluster.fork()
    await this.forkWorker(this.processRepresentation);

    // Mark self as started
    this.started = true;
  }

  /**
   * Stop master, stop all workers
   * @return {Promise<void>}
   */
  async stop() {
    const promises = [];
    for(const id of Object.keys(cluster.workers)) {
      const worker = cluster.workers[id];
      promises.push(this.sendShutdownToWorker(worker));
    }
    await Promise.all(promises);
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
    if(targetName !== this.processRepresentation.processName && targetName != null) {
      return;
    }
    await this.reloadNamedWorkers(this.workers.values());
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
    return this.sendShutdownToWorker(worker).then(() => {
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

  private sendShutdownToWorker(worker): Promise<any> {
    return new Promise((resolve) => {
      let timer = setTimeout(() => {
        resolve();
      }, SHUTDOWN_TIMEOUT);
      // tell 3rd lib cfork, it do want to be reforked
      worker._refork = false;
      worker.send({action: SHUTDOWN});
      worker.on('message', message => {
        if (message.action === FINISH_SHUTDOWN) {
          clearTimeout(timer);
          timer = null;
          resolve();
        }
      });
    });
  }

  /**
   * Kill a worker by a SOP
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
   * Send message to all workers
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
   * Fork a new worker, keep it live
   * @param {ProcessRepresentation} processRepresentation
   * @return {Promise<any>}
   */
  private forkWorker(processRepresentation: ProcessRepresentation): Promise<any> {

    const processRepresentationToWorker = {
      ...processRepresentation,
      // Set scale to 1, so ProcessBootstrap can see it is a worker not a master
      scale: 1
    };
    const workerArgs = ['--params', JSON.stringify(processRepresentationToWorker)];
    const count = processRepresentation.scale === 'auto' ? defaultWorkerCount : (processRepresentation.scale || defaultWorkerCount);
    const execArgv = process.execArgv.concat(processRepresentation.argv || []);

    // Handing TypeScript, only for unit test
    if (/\.ts$/.test(module.filename) && execArgv.indexOf('ts-node/register') === -1) {
      execArgv.push('-r', 'ts-node/register', '-r', 'nyc-ts-patch');
    }

    cFork({
      env: processRepresentation.env,
      exec: pathToProcessBootstrap,
      execArgv,
      args: workerArgs,
      silent: false,
      count: count,
      // TODO: Set field refork to be false when started by pandora dev, it will not be restarted.
      // TODO: It will exited course by exception, easy to find bugs.
      refork: true
    });

    let successCount = 0;
    return new Promise((resolve, reject) => {

      const onFork = (worker) => {
        worker.once('message', (message) => {
          const action = message && message.action;
          if (action === PROCESS_READY) {
            successCount++;
            worker[$ProcessName] = processRepresentation.processName;
            this.workers.set(worker.process.pid, worker);
            // All process started successfully
            if (successCount === count) {
              cluster.removeListener('exit', onExit);
              cluster.removeListener('fork', onFork);
              resolve();
            }
          } else if (action === PROCESS_ERROR) {
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
          process.send({action: RELOAD_ERROR, error: err});
        }
      });
    }
  }

  onClusterFork(worker) {
    // Send a message to other workers when a new worker online
    worker.once('message', (message) => {
      process.nextTick(() => {
        const action = message && message.action;
        if (action === PROCESS_READY) {
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

