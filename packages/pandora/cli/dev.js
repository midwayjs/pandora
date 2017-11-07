'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {DebugApplicationLoader} = require(path.join(PANDORA_LIB_HOME, 'debug/DebugApplicationLoader'));
const {calcAppName, attachEntryParams} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));

exports.command = 'dev <targetPath>';
exports.desc = 'Debug an application';


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

  yargs.option('inspector', {
    alias: 'i',
    describe: 'Debug Application with node-inspector',
    boolean: true
  });

};

exports.handler = function (argv) {

  if(argv.inspector) {
    console.log('Inspector coming soon...');
    process.exit(0);
  }

  const targetPathResolved = path.resolve(argv.targetPath) || process.cwd();
  const appName = argv.name ? argv.name : calcAppName(targetPathResolved);
  const mode = argv.mode ? argv.mode : 'procfile.js';

  runApplication(attachEntryParams('dev', {
    mode: mode,
    appName: appName,
    appDir: mode === 'procfile.js' ? targetPathResolved : process.cwd(),
    entryFile: mode !== 'procfile.js' ? targetPathResolved : null
  })).catch(console.error);
};

function runApplication(opts) {
  const debugApplicationLoader = new DebugApplicationLoader(opts);
  return debugApplicationLoader.start();
}
