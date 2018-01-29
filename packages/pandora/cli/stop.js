'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require('./util/cliUtils');
const {send, clearCliExit, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));
const {calcAppName} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));

exports.command = 'stop [appName]';
exports.desc = 'Stop an application';
exports.handler = function (argv) {

  const appName = argv.appName || calcAppName(process.cwd());

  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon is not running yet');
      process.exit(0);
      return;
    }
    send('stopApp', {
      appName: appName,
    }, (err, data) => {
      if (err) {
        consoleLogger.error(err);
        clearCliExit(1);
        return;
      }
      consoleLogger.info(data);
      clearCliExit(0);
    });
  });

};
