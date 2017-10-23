'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, clearCliExit, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));

exports.command = 'stop <appName>';
exports.desc = 'Stop an application';
exports.handler = function (argv) {

  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon is not running');
      process.exit(0);
      return;
    }
    send('stopApp', {
      appName: argv.appName,
    }, (err, data) => {
      if (err) {
        consoleLogger.error(data);
        clearCliExit(1);
        return;
      }
      consoleLogger.info(data);
      clearCliExit(0);
    });
  });

};
