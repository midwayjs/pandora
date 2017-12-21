import {cpus} from 'os';

export enum State {
  pending = 1,
  complete,
  stopped,
}



// *********
// Global
export const PANDORA_GLOBAL_CONFIG = 'PANDORA_CONFIG';
export const PANDORA_CWD = 'PANDORA_CWD';
export const PANDORA_HOME = 'PANDORA_HOME';



// *********
// Daemon
export const SEND_DAEMON_MESSAGE = 'send_daemon_message';
export const DAEMON_READY = 'daemon_ready';
export const DAEMON_MESSENGER = 'pandora_daemon_messenger';



// *********
// Procfile.js
export const PROCFILE_NAMES = ['procfile', 'procfile.js', 'procfile.ts'];
export const defaultWorkerCount = process.env.DEFAULT_WORKER_COUNT ? parseInt(process.env.DEFAULT_WORKER_COUNT) : cpus().length;



// *********
// Process
export const PROCESS_READY = 'process_ready';
export const PROCESS_ERROR = 'process_error';

export const WORKER_READY = 'worker_ready';
export const WORKER_EXIT = 'worker_exit';

export const SHUTDOWN = 'shutdown';
export const FINISH_SHUTDOWN = 'finish_shutdown';
export const SHUTDOWN_TIMEOUT = 5 * 1000;

export const RELOAD = 'reload';
export const RELOAD_SUCCESS = 'reload_success';
export const RELOAD_ERROR = 'reload_error';
export const RELOAD_TIMEOUT = 10 * 1000;



// *********
// Service
export const SERVICE_PREFIX_IN_HUB = '';
export const SERVICE_RESERVE_NAME = ['all'];



// *********
// spawn-wrap
export const PANDORA_PROCESS = 'PANDORA_PROCESS_REPRESENTATION';
