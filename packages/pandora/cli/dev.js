'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {DebugApplicationLoader} = require(path.join(PANDORA_LIB_HOME, 'debug/DebugApplicationLoader'));
const {calcAppName, attachEntryParams} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));
const cliUtils = require('./util/cliUtils');
const {consoleLogger} = cliUtils;

exports.command = 'dev [targetPath]';
exports.desc = 'Debug an application';


exports.builder = (yargs) => {

  yargs.option('name', {
    alias: 'n',
    describe: 'App name, it will get a name from the <targetPath> by default'
  });

  yargs.option('env', {
    alias: 'E',
    describe: 'Environment Variables, such as --env="A=1 B=2"'
  });

  yargs.option('args', {
    alias: 'a',
    describe: 'args, such as --args="--a=b --c=d"'
  });

  yargs.option('node-args', {
    alias: 'A',
    describe: 'Node.js args, such as --node-args="--expose-gc --max_old_space_size=500"'
  });

  yargs.option('inspect', {
    describe: 'Activate inspector',
    type: 'string'
  });

  yargs.option('inspect-port', {
    describe: 'Set inspector port',
    type: 'string'
  });

};

exports.handler = function (argv) {

  argv.entry = argv.targetPath;

  let sendParams;
  try {
    sendParams = attachEntryParams('dev', argv, {
      appName: calcAppName(argv.targetPath || process.cwd())
    });
  } catch(err) {
    consoleLogger.error(err);
    process.exit(1);
  }

  runApplication(sendParams).catch(console.error);
};

function runApplication(opts) {
  const debugApplicationLoader = new DebugApplicationLoader(opts);
  return debugApplicationLoader.start();
}
