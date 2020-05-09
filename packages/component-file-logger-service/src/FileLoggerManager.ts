import * as $ from '@pandorajs/dollar';
import {
  MsgSendStrategyPayload,
  DEFAULT_LOGGER_CONFIG,
  RotationStrategy,
  ILogger,
  MsgHeartbeatPayload,
  HEARTBEAT_TIME,
  LoggerConfig,
  MsgReloadPayload,
  MsgPkg,
  MESSENGER_ACTION_SERVICE,
} from './types';
import assert = require('assert');
import { EggLogger } from 'egg-logger';
import { join } from 'path';
import { MessengerClient } from '@pandorajs/messenger';

/**
 * Class LoggerManager
 */
export class FileLoggerManager {
  protected messengerClient: MessengerClient;
  protected loggerMap: Map<string, any> = new Map();
  protected connectRotator = false;
  protected stopWriteWhenNoSupervisor = true;
  protected heartbeatTime: number = HEARTBEAT_TIME;

  constructor(options?: {
    connectRotator?: boolean;
    heartbeatTime?: number;
    stopWriteWhenNoSupervisor?: boolean;
  }) {
    options = options || {};

    if (options.heartbeatTime) {
      this.heartbeatTime = options.heartbeatTime;
    }

    if (options.connectRotator != null) {
      this.connectRotator = options.connectRotator;
    }

    if (options.stopWriteWhenNoSupervisor != null) {
      this.stopWriteWhenNoSupervisor = options.stopWriteWhenNoSupervisor;
    }
  }

  public async start(): Promise<void> {
    if (!this.connectRotator) {
      return;
    }
    this.messengerClient.on(MESSENGER_ACTION_SERVICE, (message: MsgPkg) => {
      if (message.type === 'logger-reload') {
        const payload: MsgReloadPayload =
          (message.payload as MsgReloadPayload) || {};
        const uuid = payload.uuid;
        this.reload(uuid);

        return;
      }
    });
    return new Promise(resolve => {
      this.messengerClient.ready(() => {
        this.startHeartbeatWhile().catch(err => {
          $.consoleLogger.error(err);
        });
        resolve();
      });
    });
  }

  public setMessengerClient(messengerClient: MessengerClient) {
    this.messengerClient = messengerClient;
  }

  protected async startHeartbeatWhile(): Promise<void> {
    while (true) {
      for (const uuid of this.loggerMap.keys()) {
        try {
          this.messengerClient.send(MESSENGER_ACTION_SERVICE, {
            type: 'logger-heartbeat',
            payload: {
              uuid: uuid,
            } as MsgHeartbeatPayload,
          } as MsgPkg);
        } catch (err) {
          console.error(err);
        }
      }

      await new Promise(resolve => {
        const timer = setTimeout(resolve, this.heartbeatTime);
        timer.unref();
      });
    }
  }

  private nonBlocking(logger): void {
    const fileTransport = logger.get('file');
    if (fileTransport) {
      const timer = fileTransport._timer;
      if (timer) {
        timer.unref();
      }
    }
  }

  public createLogger(loggerName, loggerConfig: LoggerConfig): ILogger {
    loggerConfig = Object.assign({}, DEFAULT_LOGGER_CONFIG, loggerConfig);

    const uuid = $.genereateUUID();
    const fileName = loggerConfig.name
      ? loggerConfig.name
      : loggerName + '.log';
    const filePath = join(loggerConfig.dir, fileName);
    const skipWriteFile =
      this.stopWriteWhenNoSupervisor &&
      (!this.connectRotator || !this.messengerClient.isOK);
    const newLogger = new EggLogger({
      file: filePath,
      level: skipWriteFile ? 'NONE' : loggerConfig.level,
      consoleLevel: loggerConfig.stdoutLevel,
      eol: loggerConfig.eol,
    });
    // make logger non blocking
    this.nonBlocking(newLogger);
    this.loggerMap.set(uuid, newLogger);
    this.sendRotationStrategy({
      uuid: uuid,
      file: filePath,
      type: loggerConfig.type,
      rotateDuration: loggerConfig.rotateDuration,
      maxFileSize: loggerConfig.maxFileSize,
      maxFiles: loggerConfig.maxFiles,
    });

    return newLogger;
  }

  protected sendRotationStrategy(strategy: RotationStrategy) {
    if (this.connectRotator) {
      this.messengerClient.ready(() => {
        this.messengerClient.send(MESSENGER_ACTION_SERVICE, {
          type: 'logger-send-strategy',
          payload: {
            strategy: strategy,
          } as MsgSendStrategyPayload,
        } as MsgPkg);
      });
    }
  }

  protected reload(uuid?) {
    assert(
      !uuid || this.loggerMap.has(uuid),
      `Could not found logger uuid ${uuid}`
    );
    if (uuid) {
      const logger = this.loggerMap.get(uuid);
      logger.reload();
    } else {
      for (const logger of this.loggerMap.values()) {
        logger.reload();
      }
    }
  }
}
