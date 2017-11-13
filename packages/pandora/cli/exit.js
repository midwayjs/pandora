'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {isDaemonRunning, send, barrierDaemon, getDaemonClient} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));

exports.command = 'exit';
exports.desc = 'Stop all applications and exit the pandora daemon process';
exports.handler = function () {
  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon has not running yet');
      process.exit(0);
      return;
    }
    barrierDaemon().then(() => {
      return getDaemonClient();
    }).then((client) => {
      client.once('error', () => {
        process.exit(0);
      });
      send('exit', (err, data) => {
        if (err) {
          consoleLogger.error(data);
          process.exit(1);
          return;
        }
        consoleLogger.info(data);
        process.exit(0);
      });
    });

  });
};
