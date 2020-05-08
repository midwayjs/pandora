import { MessengerServer } from 'pandora-messenger';
import assert = require('assert');
import * as $ from 'pandora-dollar';
import moment = require('moment');
import fs = require('mz/fs');
import ms = require('humanize-ms');
import {
  DEFAULT_ROTATION_CONFIG,
  ILogger,
  HEARTBEAT_TIME_MAX,
  MESSENGER_ACTION_SERVICE,
  MsgReloadPayload,
  MsgHeartbeatPayload,
  MsgSendStrategyPayload,
  RotationStrategy,
  MsgPkg,
} from './types';

const ERROR_MSG_TIMER_BEEN_REMOVED = 'TIMER_BEEN_REMOVED';
const MIN_INTERVAL = 60 * 1000;

const emptyFn = () => {};

export class FileLoggerRotator {
  protected logger: ILogger = {
    log: emptyFn,
    debug: emptyFn,
    info: emptyFn,
    warn: console.warn,
    error: console.error,
  } as ILogger;
  protected messengerServer: MessengerServer;
  protected strategyMap: Map<string, RotationStrategy> = new Map();
  protected strategyHeartbeat: Map<string, number> = new Map();
  protected timerClearances: { clear(): void }[] = [];
  protected heartbeatCheckTime = 10000;
  protected heartbeatTimeMax = HEARTBEAT_TIME_MAX;

  constructor(options?: {
    logger?: ILogger;
    heartbeatCheckTime?: number;
    heartbeatTimeMax?: number;
  }) {
    options = options || {};
    if (options.logger) {
      this.logger = options.logger;
    }
    if (options.heartbeatCheckTime) {
      this.heartbeatCheckTime = options.heartbeatCheckTime;
    }
    if (options.heartbeatTimeMax) {
      this.heartbeatTimeMax = options.heartbeatTimeMax;
    }
  }

  /**
   * Start logger rotator
   * @return {Promise<void>}
   */
  public async start(): Promise<void> {
    this.messengerServer.on(
      MESSENGER_ACTION_SERVICE,
      (message: MsgPkg, reply) => {
        if (message.type === 'logger-send-strategy') {
          const payload: MsgSendStrategyPayload = message.payload as MsgSendStrategyPayload;
          const strategy = payload.strategy;
          try {
            this.receiveStrategy(strategy);
          } catch (err) {
            reply({ error: err });
            return;
          }
          reply({ error: null, result: 'ok' });
          return;
        }

        if (message.type === 'logger-heartbeat') {
          const payload: MsgHeartbeatPayload = message.payload as MsgHeartbeatPayload;
          const uuid = payload.uuid;
          if (this.strategyMap.has(uuid)) {
            const now = Date.now();
            this.strategyHeartbeat.set(uuid, now);
          }
        }
      }
    );

    // Support `kill -USR1` to trigger reload logs
    process.on('SIGUSR1', () => {
      this.broadcastReload();
    });

    // Start to handing heartbeat
    this.startHeartbeatWhile().catch(err => {
      this.logger.error(err);
      throw err;
    });

    await new Promise(resolve => {
      this.messengerServer.ready(resolve);
    });

    this.logger.info('[loggerRotator] started service.');
  }

  /**
   * Receive a log rotator strategy
   * @param {RotationStrategy} strategy
   */
  public receiveStrategy(strategy: RotationStrategy) {
    strategy = Object.assign({}, DEFAULT_ROTATION_CONFIG, strategy);

    const uuid: string = strategy.uuid;
    assert(
      !this.strategyMap.has(uuid),
      'Strategy uuid ' + uuid + ' already has'
    );
    this.strategyMap.set(uuid, strategy);
    const now = Date.now();
    this.strategyHeartbeat.set(uuid, now);
    this.reentry();
  }

  /**
   * Reentry while
   */
  protected reentry() {
    if (this.timerClearances.length) {
      for (const { clear } of this.timerClearances) {
        clear();
      }
      this.timerClearances.length = 0;
    }
    this.startLogRotateByDateTimer().catch(err => {
      if (err.message !== ERROR_MSG_TIMER_BEEN_REMOVED) {
        this.logger.error(err);
      }
    });
    this.startLogRotateBySize().catch(err => {
      if (err.message !== ERROR_MSG_TIMER_BEEN_REMOVED) {
        this.logger.error(err);
      }
    });
  }

  /**
   * start heartbeat while
   * @return {Promise<void>}
   */
  protected async startHeartbeatWhile(): Promise<void> {
    while (true) {
      await $.promise.delay(this.heartbeatCheckTime);
      const now = Date.now();
      let needRestart = false;
      for (const [uuid, beatTime] of this.strategyHeartbeat.entries()) {
        if (now - beatTime > this.heartbeatTimeMax) {
          const strategy = this.strategyMap.get(uuid);
          this.logger.warn(
            `logger ${strategy.file} heartbeat timeout will remove log rotate task`
          );
          this.removeStrategyWithoutRestart(uuid);
          needRestart = true;
        }
      }
      if (needRestart) {
        this.reentry();
      }
    }
  }

  /**
   * Start fileSize cutting while
   * @return {Promise<void>}
   */
  protected async startLogRotateBySize(): Promise<void> {
    while (true) {
      const dealyMs = this.caclIntervalForRotateLogBySize();
      this.logger.info(
        `will rotate by size after ${ms(
          dealyMs
        )} ${this.getStrategiesRotateBySize()
          .map(x => x.file)
          .join(', ')}`
      );
      await this.delayOnOptimisticLock(dealyMs);
      await this.rotateLogBySize();
    }
  }

  /**
   * Start date cutting while
   * @return {Promise<void>}
   */
  protected async startLogRotateByDateTimer(): Promise<void> {
    while (true) {
      const now = moment();
      const ONE_DAY = ms('1d');
      // 计算离0点还差的时间间隔
      const dealyMs = now.clone().add(ONE_DAY, 'ms').startOf('day').diff(now);
      this.logger.info(
        `will rotate by date after ${ms(
          dealyMs
        )} ${this.getStrategiesRotateByDate()
          .map(x => x.file)
          .join(', ')}`
      );
      await this.delayOnOptimisticLock(dealyMs);
      await this.rotateLogByDate();
    }
  }

  /**
   * Cut log file by date
   * @return {Promise<void>}
   */
  protected async rotateLogByDate(): Promise<void> {
    const strategiesRotateByDate = this.getStrategiesRotateByDate();
    this.logger.info(
      `start rename files:\n${strategiesRotateByDate
        .map(x => x.file)
        .join('\n')}`
    );
    for (const strategy of strategiesRotateByDate) {
      try {
        await this.renameLogfile(strategy.file);
      } catch (err) {
        this.logger.error(err);
      }
    }
    this.broadcastReload();
  }

  /**
   * Rename log file, put date as affix
   * @param {string} logfile
   * @return {Promise<void>}
   */
  protected async renameLogfile(logfile: string): Promise<void> {
    const logname = moment().subtract(1, 'days').format('.YYYY-MM-DD');
    const newLogfile = logfile + logname;
    try {
      const exists = await fs.exists(newLogfile);
      if (exists) {
        return this.logger.error(`logfile ${newLogfile} exists!!!`);
      }
      await fs.rename(logfile, newLogfile);
    } catch (err) {
      err.message = `rename logfile ${logfile} to ${newLogfile} ${err.message}`;
      this.logger.error(err);
    }
  }

  /**
   * A cycle to find out which log file needs to cut
   * @return {Promise<void>}
   */
  protected async rotateLogBySize(): Promise<void> {
    for (const item of this.getStrategiesRotateBySize()) {
      try {
        const logfile = item.file;
        const maxFileSize = item.maxFileSize;
        const exists = await fs.exists(logfile);
        if (exists) {
          const stat = await fs.stat(logfile);
          if (stat.size >= maxFileSize) {
            this.logger.info(
              `File ${logfile} reach the maximum file size, current size: ${stat.size}, max size: ${maxFileSize}`
            );
            await this.rotateBySize(item);
          }
        }
      } catch (e) {
        e.message = `${e.message}`;
        this.logger.error(e);
      }
    }
  }

  /**
   * Cut log file by size
   * @param {RotationStrategy} strategy
   * @return {Promise<void>}
   */
  protected async rotateBySize(strategy: RotationStrategy): Promise<void> {
    const logfile = strategy.file;
    const maxFiles = strategy.maxFiles;
    const exists = await fs.exists(logfile);
    if (!exists) {
      return;
    }
    // remove max
    const maxFileName = `${logfile}.${maxFiles}`;
    const maxExists = await fs.exists(maxFileName);
    if (maxExists) {
      await fs.unlink(maxFileName);
    }
    // 2->3, 1->2
    for (let i = maxFiles - 1; i >= 1; i--) {
      await this.renameOrDelete(`${logfile}.${i}`, `${logfile}.${i + 1}`);
    }
    // logfile => logfile.1
    await fs.rename(logfile, `${logfile}.1`);
    this.broadcastReload();
  }

  /**
   * If file exist, try backup. If backup filed, remove it.
   * This operation for the file size cutting only.
   * @param targetPath
   * @param backupPath
   * @return {Promise<void>}
   */
  protected async renameOrDelete(targetPath, backupPath): Promise<void> {
    const targetExists = await fs.exists(targetPath);
    if (!targetExists) {
      return;
    }
    const backupExists = await fs.exists(backupPath);
    if (backupExists) {
      await fs.unlink(targetPath);
    } else {
      await fs.rename(targetPath, backupPath);
    }
  }

  /**
   * Calculate interval time for rotate log by size
   * @return {number}
   */
  protected caclIntervalForRotateLogBySize() {
    const userSpecedDurations = this.getStrategiesRotateBySize()
      .map((x: RotationStrategy) => x.rotateDuration)
      // the const interval could be Infinity if this.getStrategiesRotateBySize() get an empty array, given a default value next line
      .concat([MIN_INTERVAL * 10]);

    const interval = Math.max(Math.min(...userSpecedDurations), MIN_INTERVAL);
    return interval;
  }

  /**
   * Broadcast reload message to all client
   * @param {string} uuid
   */
  protected broadcastReload(uuid?: string) {
    this.messengerServer.broadcast(MESSENGER_ACTION_SERVICE, {
      type: 'logger-reload',
      payload: {
        uuid: uuid,
      } as MsgReloadPayload,
    } as MsgPkg);
  }

  /**
   * Produce a delay on an optimistic lock, optimistic lock can broke this delay
   * @param ms
   * @return {Promise<any>}
   */
  protected delayOnOptimisticLock(ms): Promise<any> {
    return new Promise((resolve, reject) => {
      let emit = false;
      const timer = setTimeout(() => {
        if (emit) {
          return;
        }
        emit = true;
        removeTimerClearance();
        resolve();
      }, ms);
      const timerClearance = {
        clear: () => {
          if (emit) {
            return;
          }
          emit = true;
          removeTimerClearance();
          reject(new Error(ERROR_MSG_TIMER_BEEN_REMOVED));
          clearTimeout(timer);
        },
      };
      const removeTimerClearance = () => {
        const idx = this.timerClearances.indexOf(timerClearance);
        if (-1 !== idx) {
          this.timerClearances.slice(idx, 1);
        }
      };
      this.timerClearances.push(timerClearance);
    });
  }

  /**
   * Get unique strategies list
   * @return {RotationStrategy[]}
   */
  protected getFilteredStrategiesList(): RotationStrategy[] {
    const ret = [];
    const fileHashFilter: Map<string, RotationStrategy> = new Map();
    for (const strategy of this.strategyMap.values()) {
      if (!fileHashFilter.has(strategy.file)) {
        ret.push(strategy);
        fileHashFilter.set(strategy.file, strategy);
      }
    }
    return ret;
  }

  /**
   * Get all the strategies of the rotate by date
   * @return {RotationStrategy[]}
   */
  protected getStrategiesRotateByDate(): RotationStrategy[] {
    const ret = [];
    for (const strategy of this.getFilteredStrategiesList()) {
      if (strategy.type === 'date') {
        ret.push(strategy);
      }
    }
    return ret;
  }

  /**
   * Get all the strategies of the rotate by size
   * @return {RotationStrategy[]}
   */
  protected getStrategiesRotateBySize(): RotationStrategy[] {
    const ret = [];
    for (const strategy of this.getFilteredStrategiesList()) {
      if (strategy.type === 'size') {
        ret.push(strategy);
      }
    }
    return ret;
  }

  /**
   * Remove a strategy without restart
   * @param uuid
   */
  protected removeStrategyWithoutRestart(uuid) {
    assert(
      this.strategyMap.has(uuid),
      'Could not found strategy uuid ' + uuid + ''
    );
    this.strategyMap.delete(uuid);
    this.strategyHeartbeat.delete(uuid);
  }

  public setMessengerServer(messengerServer: MessengerServer) {
    this.messengerServer = messengerServer;
  }
}
