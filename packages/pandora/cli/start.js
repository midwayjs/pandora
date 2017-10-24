'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {calcAppName} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));

exports.command = 'start <targetPath>';
exports.desc = 'Start an application';
exports.builder = (yargs) => {

  yargs.option('name', {
    alias: 'n',
    describe: 'App name, it will get a name from the <targetPath> by default'
  });

  yargs.option('mode', {
    alias: 'm',
    describe: 'The start mode, options: procfile.js or cluster or fork',
    default: 'procfile.js'
  });

  yargs.option('scale', {
    alias: 's',
    describe: 'Only when the start mode be cluster, to specify the worker numbers of cluster'
  });

  yargs.option('inject-monitoring', {
    alias: 'i',
    describe: 'Only when the start mode be fork, inject the monitoring automatically before each child process started',
    boolean: true
  });

};
/**
 * start an app
 * @param argv
 */
exports.handler = function (argv) {
  const targetPathResolved = path.resolve(argv.targetPath) || process.cwd();
  const appName = argv.name ? argv.name : calcAppName(targetPathResolved);

  const mode = argv.mode ? argv.mode : 'procfile.js';
  const scale = argv.scale ? argv.scale : null;
  const injectMonitoring = argv.hasOwnProperty('inject-monitoring');

  const send = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler')).send;
  consoleLogger.info('Starting ' + appName + ' at ' + targetPathResolved);

  send('start', {
    mode: mode,
    appName: appName,
    appDir: mode === 'procfile.js' ? targetPathResolved : process.cwd(),
    entryFile: mode !== 'procfile.js' ? targetPathResolved : null,
    scale: scale,
    injectMonitoring: injectMonitoring
  }, (err, data) => {
    if (err) {
      consoleLogger.error(data);
      process.exit(1);
      return;
    }
    consoleLogger.info(data);
    process.exit(0);
  });

};
