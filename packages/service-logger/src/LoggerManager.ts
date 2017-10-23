import * as $ from 'pandora-dollar';
import {MsgSendStrategyPayload, DEFAULT_LOGGER_CONFIG, RotationStrategy, ILogger, MsgHeartbeatPayload, HEARTBEAT_TIME, LoggerConfig, MsgReloadPayload, MsgPkg, MESSENGER_ACTION_SERVICE, SOCKET_FILE_NAME} from './domain';
import Path = require('path');
import assert = require('assert');
import {MessengerClient, default as Messenger} from 'pandora-messenger';
import {EnvironmentUtil} from 'pandora-env';
import {EggLogger} from 'egg-logger';
import {EventEmitter} from 'events';
import {EmitterTransport} from './EmitterTransport';

/**
 * Class LoggerManager
 */
export class LoggerManager extends EventEmitter {

  protected messengerClient: MessengerClient;
  protected loggerMap: Map<string, any> = new Map();
  protected envUtil = EnvironmentUtil.getInstance();

  connectRotator = false;
  constructor(options?: {
    connectRotator?: boolean;
    heartbeatTime?: number;
  }) {
    super();
    options = options || {};

    if(options.heartbeatTime) {
      this.heartbeatTime = options.heartbeatTime;
    }
    let isUnitTest = false;
    try {
      isUnitTest = this.envUtil.is('test');
    } catch(err) {
      // console.error(err);
    }
    options.connectRotator = !!(options.connectRotator && !isUnitTest && !process.env.DO_NOT_CONNECT_MONITOR);

    if(options.connectRotator) {
      this.connectRotator = true;
      this.messengerClient = Messenger.getClient({
        name: SOCKET_FILE_NAME
      });
      this.messengerClient.on(MESSENGER_ACTION_SERVICE, (message: MsgPkg) => {
        if(message.type === 'logger-reload') {
          const payload: MsgReloadPayload = <MsgReloadPayload> message.payload || {};
          const uuid = payload.uuid;
          this.reload(uuid);

          return;
        }
      });
      this.startHeartbeatWhile().catch((err) => {
        console.error(err);
      });
    }
  }

  protected heartbeatTime: number = HEARTBEAT_TIME;
  protected async startHeartbeatWhile(): Promise<void> {
    while (true) {
      for(let uuid of this.loggerMap.keys()) {
        try {
          this.messengerClient.send(MESSENGER_ACTION_SERVICE, <MsgPkg> {
            type: 'logger-heartbeat',
            payload: <MsgHeartbeatPayload> {
              uuid: uuid
            }
          });
        } catch (err) {
          console.error(err);
        }
      }
      await $.promise.delay(this.heartbeatTime);
    }
  }

  public createLogger(loggerName, loggerConfig: LoggerConfig): ILogger {

    loggerConfig = Object.assign({}, DEFAULT_LOGGER_CONFIG, loggerConfig);

    const uuid = $.genereateUUID();
    const fileName = loggerConfig.name ? loggerConfig.name : loggerName + '.log';
    const filePath = Path.join(loggerConfig.dir, fileName);
    const newLogger = new EggLogger({
      file: filePath,
      level: loggerConfig.level,
      consoleLevel: loggerConfig.stdoutLevel
    });
    newLogger.set('emitter', new EmitterTransport({
      level: loggerConfig.emitterLevel,
      loggerName, fileName, filePath
    }, this));
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
    if(this.connectRotator) {
      this.messengerClient.send(MESSENGER_ACTION_SERVICE, <MsgPkg> {
        type: 'logger-send-strategy',
        payload: <MsgSendStrategyPayload> {
          strategy: strategy
        }
      });
    }
  }

  protected reload(uuid?) {
    assert(!uuid || this.loggerMap.has(uuid), `Could not found logger uuid ${uuid}`);
    if(uuid) {
      const logger = this.loggerMap.get(uuid);
      logger.reload();
    } else {
      for( let logger of this.loggerMap.values() ) {
        logger.reload();
      }
    }
  }
}
