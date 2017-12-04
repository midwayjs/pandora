'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));
const {calcAppName} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));

exports.command = 'restart [appName]';
exports.desc = 'Restart a running application';
exports.handler = function (argv) {


  const appName = argv.appName || calcAppName(process.cwd());

  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon is not running yet');
      process.exit(0);
      return;
    }
    send('restart', {
      appName: appName,
    }, (err, data) => {
      if (err) {
        consoleLogger.error(err);
        process.exit(1);
        return;
      }
      consoleLogger.info(data);
      process.exit(0);
    });
  });
};
