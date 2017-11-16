'use strict';
const path = require('path');
const chalk = require('chalk');
const debug = require('debug')('pandora:cli:list');
const table = require('table').table;
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));
const CONST = require(path.join(PANDORA_LIB_HOME, './const'));
const State = CONST.State;

exports.command = 'list';
exports.desc = 'List all applications';
exports.handler = function () {

  isDaemonRunning().then((isRunning) => {
    if (!isRunning) {
      consoleLogger.info('Daemon is not running yet');
      process.exit(0);
      return;
    }
    send('list', {}, (err, data) => {
      if (err) {
        consoleLogger.error(err);
        process.exit(1);
        return;
      }
      const tableData = [
        [
          'AppName',
          'Mode',
          'PID',
          'AppDir',
          'State',
        ]
      ];
      debug(data);
      for (const app of data) {
        let state = State[app.state];
        state = (state === 'complete' ? chalk.green('Running') : chalk.red(state)).replace(/^.{1}/, (firstChar) => firstChar.toUpperCase());
        tableData.push([
          app.name,
          app.mode,
          app.pids.join(','),
          app.appDir,
          state,
        ]);
      }
      console.log(table(tableData));
      process.exit(0);
    });
  });

};
