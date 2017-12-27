'use strict';
import Messenger, {MessengerClient} from 'pandora-messenger';
import {getDaemonStdoutLogPath} from '../universal/LoggerBroker';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import {spawn} from 'child_process';
import {DAEMON_MESSENGER, DAEMON_READY, SEND_DAEMON_MESSAGE} from '../const';
import {dirname} from 'path';
import mkdirp = require('mkdirp');

// TODO: Refactor
const {consoleLogger} = require('../../cli/util/cliUtils');

const is = require('is-type-of');
const tmpDir = os.tmpdir();
const pidFile = path.join(tmpDir, 'nodejs_pandora.pid');
const pathDaemonBootstrap = require.resolve('./DaemonBootstrap');
let preparedClient: MessengerClient = null;

/**
 * Get messenger client of the daemon
 * @return {Client}
 */
function getMessengerClient() {
  return new Messenger.Client({
    name: DAEMON_MESSENGER,
  });
}

/**
 * Determine the daemon is running
 * @return {Promise<boolean>}
 */
export function isDaemonRunning(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = getMessengerClient();
    client.once('connect', () => {
      resolve(true);
      client.close();
    });
    client.once('error', err => {
      resolve(false);
    });
  });
};

/**
 * Ensure the daemon is running
 * @param options
 * @return {Promise<any>}
 */
export async function barrierDaemon(options?) {
  if (!await isDaemonRunning()) {
    return new Promise((resolve, reject) => {
      startDaemonReal(options, resolve, reject);
    });
  }
  return Promise.resolve();
}

export function getDaemonClient(args?: { extensionPath }): Promise<MessengerClient> {
  if (preparedClient) return Promise.resolve(preparedClient);
  return new Promise((resolve, reject) => {
    const client = Messenger.getClient({
      name: DAEMON_MESSENGER,
    });
    client.on('connect', () => {
      preparedClient = client;
      resolve(client);
      client.removeListener('error', onError);
    });

    function onError(err) {
      reject(err);
    }

    client.once('error', onError);
  });
}

/**
 * Send a message to the daemon, it will start the daemon automatically if that is't running.
 * @param command
 * @param args
 * @param callback
 * @param timeout
 * @return {Promise<void>}
 */
export async function send(command, args, callback, timeout?): Promise<void> {
  timeout = timeout || 300 * 1000;
  try {
    await barrierDaemon();
    const daemonClient = await getDaemonClient({extensionPath: args.extensionPath});
    daemonClient.send(SEND_DAEMON_MESSAGE,
      {command, args}, (err, data) => {
        if (err) {
          return callback(err, data);
        }
        if (data && data.error) {
          return callback(data.error, data.data);
        }
        return callback(null, data.data);
      }, timeout);
  } catch (err) {
    callback(err);
  }
}

/**
 * Exit the daemon automatically if there not remind any application.
 * @param code
 */
export function clearCliExit(code) {
  code = code != null ? code : 0;
  send('list', {}, (err, data) => {
    if (data && data.length === 0) {
      consoleLogger.info('No application remind, will exit the pandora daemon automatically');
      preparedClient.once('error', () => {
        process.exit(code);
      });
      send('exit', {}, (err, data) => {
        if (err) {
          consoleLogger.error(data);
          process.exit(code);
          return;
        }
        consoleLogger.info(data);
        process.exit(code);
      });
    } else {
      process.exit(code);
    }
  });
}

function startDaemonReal(options, resolve, reject) {
  options = options || {};
  if (is.function(options)) {
    resolve = options;
    options = {};
  }

  const args = [];
  if (/\.ts$/.test(module.filename)) {
    args.push('-r', 'ts-node/register', '-r', 'nyc-ts-patch');
  }
  args.push(pathDaemonBootstrap);

  const daemonStdoutPath = getDaemonStdoutLogPath();
  const daemonStdoutDir = dirname(daemonStdoutPath);
  mkdirp.sync(daemonStdoutDir);
  const stdout = fs.openSync(daemonStdoutPath, 'a');

  const daemon = spawn(process.execPath, args, <any> {
    stdio: ['ignore', stdout, stdout, 'ipc'],
    env: Object.assign(process.env, {
      extensionPath: options.extensionPath
    }),
    detached: true,
  });

  daemon.on('exit', function (code, signal) {
    const err = new Error(`Daemon [ pid = ${daemon.pid} ] Died unexpectedly with exit code ${code} , signal ${signal}`);
    reject(err);
  });

  daemon.on('message', function (message) {
    consoleLogger.info(`Daemon [ pid = ${daemon.pid} ] Started successfully.`);
    if (message === DAEMON_READY) {
      fs.writeFileSync(pidFile, daemon.pid);
      resolve();
    }
  });
  return daemon;
}
