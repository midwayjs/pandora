'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));

exports.command = 'pid <appName>';
exports.desc = 'Get the PID of a running application';
exports.handler = function(argv) {

  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon has not running yet');
      process.exit(0);
      return;
    }
    send('list', {
    }, (err, data) => {
      if(err) {
        consoleLogger.error(err);
        process.exit(1);
        return;
      }
      for(const app of data) {
        if(app.name === argv.appName) {
          console.log('PID: ' + app.pids.join(','));
          process.exit(0);
          return;
        }
      }
      console.log('Error: App ' + argv.appName + ' Not found');
      process.exit(1);
    });
  });

};

