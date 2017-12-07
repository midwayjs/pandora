'use strict';
export enum State {
  pending = 1,
  complete,
  stopped,
}

export const PROCFILE_NAMES = ['procfile', 'procfile.js'];
export const MASTER = 'master';
export const READY = 'process_ready';
export const ERROR = 'process_error';
export const WORKER_RELOAD = 'reload-worker';
export const WORKER_READY = 'worker_ready';
export const WORKER_EXIT = 'worker_exit';
export const QUERY_WORKER = 'query_worker';
export const LOGGER_RELOAD = 'logger_reload';
export const APP_READY = 'app_ready';
export const APP_EXIT = 'app_exit';
export const AGENT_READY = 'agent_ready';
export const AGENT_EXIT = 'agent_exit';
export const REGISTER_MESSENGER_CLIENT = 'register_messenger_client';
export const REGISTER_MESSENGER_CLIENT_ACK = 'register_messenger_client_ack';
export const SEND_APP_MESSAGE = 'send_app_message';
export const SEND_MONITOR_MESSAGE = 'send_monitor_message';
export const SEND_BROADCAST_MESSAGE = 'send_broadcast_message';
export const SEND_DAEMON_MESSAGE = 'send_daemon_message';
export const CLIENT_COMMAND = 'client_command';
// daemon进程启动成功
export const DAEMON_READY = 'daemon_ready';
// app启动成功
export const APP_START_SUCCESS = 'app_start_success';
// app启动失败
export const APP_START_ERROR = 'app_start_error';

export const CLIENT_COMMAND_RES = 'client_command_res';

export const PUBLISH_TOPIC_MESSAGE = 'publish_topic_message';
export const SUBSCRIBE_TOP_MESSAGE = 'subscribe_topic_message';

export const SHUTDOWN = 'shutdown';
export const FINISH_SHUTDOWN = 'finish_shutdown';
export const SHUTDOWN_TIMEOUT = 5000;

// reload 进程
export const RELOAD = 'reload';
export const RELOAD_SUCCESS = 'reload_success';
export const RELOAD_ERROR = 'reload_error';
export const CLIENT = 'client';
export const DAEMON_MESSENGER = 'pandora_daemon_messenger';
export const PANDORA_GLOBAL_CONFIG = 'PANDORA_CONFIG';
export const PANDORA_CWD = 'PANDORA_CWD';


// service
export const SERVICE_PREFIX_IN_HUB = '';
export const SERVICE_RESERVE_NAME = ['all'];

// env names
export const PANDORA_APPLICATION = 'PANDORA_APPLICATION';

