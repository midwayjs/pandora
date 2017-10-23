export interface ConfigInterface {
  loggers: {
    [loggerName: string]: LoggerConfig;
  };
}

export const MESSENGER_ACTION_SERVICE = 'LOGGER_INTERNAL';
export const SOCKET_FILE_NAME = 'pandora_logger';
export const HEARTBEAT_TIME = 1000 * 60 * 2;
export const HEARTBEAT_TIME_MAX = 1000 * 60 * 3;

export type LoggerLevel = 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

export type RotationType = 'date' | 'size';

export interface RotationStrategy {
  uuid: string;
  type: RotationType;
  file: string;
  rotateDuration?: number;
  maxFiles?: number;
  maxFileSize?: number;
}


export interface LoggerConfig {
  name?: string;
  dir?: string;
  stdoutLevel?: LoggerLevel;
  level?: LoggerLevel;
  emitterLevel?: LoggerLevel;
  type?: RotationType;
  rotateDuration?: number;
  maxFiles?: number;
  maxFileSize?: number;
}

export const DEFAULT_ROTATION_CONFIG = {
  type: <RotationType> 'date',
  maxFiles: 10,
  maxFileSize: 300 * 1024 * 1024,
  rotateDuration: 5 * 60 * 1000,
};

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  ...DEFAULT_ROTATION_CONFIG,
  stdoutLevel: 'ERROR',
  level: 'WARN',
  emitterLevel: 'INFO'
};

export interface MsgPkg {
  type: 'logger-send-strategy' | 'logger-reload' | 'logger-heartbeat';
  payload: MsgSendStrategyPayload | MsgReloadPayload | MsgHeartbeatPayload;
}

export interface MsgSendStrategyPayload {
  strategy: RotationStrategy;
}

export interface MsgReloadPayload {
  uuid?: string;
}

export interface MsgHeartbeatPayload {
  uuid?: string;
}

export interface ILogger {
  debug (...args);
  warn (...args);
  info (...args);
  error (...args);
  log (...args);
  write (...args);
}
