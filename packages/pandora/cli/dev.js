'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {DebugApplicationLoader} = require(path.join(PANDORA_LIB_HOME, 'debug/DebugApplicationLoader'));
const {calcAppName, attachEntryParams} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));
const cliUtils = require('./util/cliUtils');

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

  yargs.option('argv', {
    alias: 'A',
    describe: 'Node.js argv, such as --argv="--expose-gc --max_old_space_size=500"'
  });

};

exports.handler = function (argv) {

  if(argv.inspector) {
    console.log('Inspector coming soon...');
    process.exit(0);
  }
  argv.entry = argv.targetPath;
  const sendParams = attachEntryParams('dev', argv, {
    appName: calcAppName(process.cwd())
  });

  cliUtils.preCheck(sendParams.entry, sendParams.appName);
  runApplication(sendParams).catch(console.error);
};

function runApplication(opts) {
  const debugApplicationLoader = new DebugApplicationLoader(opts);
  return debugApplicationLoader.start();
}
