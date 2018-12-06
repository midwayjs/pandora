'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {cliParamsToApplicationRepresentation} = require(path.join(PANDORA_LIB_HOME, 'common/Helpers'));
const { FrontApplicationLoader } = require(path.join(PANDORA_LIB_HOME, 'action/FrontApplicationLoader'));
const cliUtils = require('./util/cliUtils');
const {consoleLogger} = cliUtils;

exports.command = 'start [targetPath]';
exports.desc = 'Start an application';
exports.builder = (yargs) => {

  yargs.option('config', {
    alias: 'c',
    // TODO: describe
    describe: 'Config'
  });

  yargs.option('daemon', {
    alias: 'd',
    // TODO: describe
    describe: 'Daemon',
    boolean: true
  });

  yargs.option('name', {
    alias: 'n',
    describe: 'App name, it will get a name from [targetPath] by default'
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

  yargs.option('npm', {
    describe: 'Find the Application by require.resolve()',
    boolean: true
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
/**
 * start an app
 * @param argv
 */
exports.handler = function (argv) {

  if(argv.npm) {
    if(!argv.targetPath) {
      consoleLogger.error('[targetPath] is required when --npm flag enabled');
      process.exit(1);
      return;
    }
    if(!argv.name) {
      consoleLogger.error('option --name is required when --npm flag enabled');
      process.exit(1);
      return;
    }
    const resolveTarget = cliUtils.dirnameUntilPkgJson(require.resolve(argv.targetPath));
    if(!resolveTarget) {
      consoleLogger.error('Can\'t found ' + argv.targetPath + ' from ' + __dirname);
    }
    consoleLogger.important('Resolve ' + argv.targetPath + ' to ' + resolveTarget);
    argv.targetPath = resolveTarget;
  }

  argv.entry = argv.targetPath;

  let loaderOpts;
  try {
    loaderOpts = cliParamsToApplicationRepresentation('start', argv);
  } catch(err) {
    consoleLogger.error(err);
    process.exit(1);
  }

  const loader = new FrontApplicationLoader(loaderOpts);
  loader.start().catch((err) => {
    consoleLogger.error(err);
    process.exit(1);
  });


};
