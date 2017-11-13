'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));

exports.command = 'restart <appName>';
exports.desc = 'Restart a running application';
exports.handler = function (argv) {
  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon has not running yet');
      process.exit(0);
      return;
    }
    send('restart', {
      appName: argv.appName,
    }, (err, data) => {
      if (err) {
        consoleLogger.error(data);
        process.exit(1);
        return;
      }
      consoleLogger.info(data);
      process.exit(0);
    });
  });
};
