'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {getAppLogPath} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
exports.command = 'log <appName>';
exports.desc = 'Show logs of an application';
exports.handler = function (argv) {
  console.log('You can see log file: ' + getAppLogPath(argv.appName, 'nodejs_stdout'));
  console.log('CLI pandora log will coming in next version...');
  process.exit(0);
};
