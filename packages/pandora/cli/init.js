'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {calcAppName} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));
const cliUtils = require('./util/cliUtils');

exports.command = 'init <filePath>';
exports.desc = 'Init a Pandora.js project';
exports.builder = (yargs) => {

  yargs.option('name', {
    alias: 'n',
    describe: 'App name, it will get a name from process.cwd() by default'
  });

};
/**
 * start an app
 * @param argv
 */
exports.handler = function (argv) {
  const appName = argv.name || calcAppName(process.cwd());
  cliUtils.initProcfile(argv.filePath, appName);
};
