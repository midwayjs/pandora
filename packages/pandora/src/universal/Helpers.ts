'use strict';
import {dirname, join, resolve} from 'path';
import {statSync} from 'fs';
import {PANDORA_GLOBAL_CONFIG} from '../const';
import {GlobalConfigProcessor} from './GlobalConfigProcessor';
const extend = require('extend');

export function calcAppName(dir?) {
  let ret;
  try {
    const pkg = require(join(process.cwd(), 'package.json'));
    ret = pkg.name;
  } catch (err) {
    ret = null;
  }
  if (!ret && dir) {
    ret = dir.split('/').slice(-1)[0] || null;
  }
  return ret;
}

export function attachEntryParams(command, cliConfig, defaultConfig = {}): any {

  const currentPath = process.cwd();
  let pandoraConfig;
  try {
    const pandoraAttachConfig = require(`${currentPath}/package.json`)['pandora'];
    pandoraConfig = pandoraAttachConfig[command] || {};
    pandoraConfig['config'] = pandoraConfig['config'] || [];

    // set global config to environment
    pandoraConfig['config'].push(process.env[PANDORA_GLOBAL_CONFIG] || '');
    process.env[PANDORA_GLOBAL_CONFIG] = pandoraConfig['config'].filter((text) => {
      return !!text;
    }).join(GlobalConfigProcessor.GLOBAL_PACKAGE_SPLIT);
  } catch (err) {
    // console.log(err);
    pandoraConfig = {};
  }

  const sendConfig = extend(true, defaultConfig, pandoraConfig || {}, cliConfig);
  sendConfig['entry'] = sendConfig['entry'] || currentPath;

  const p = resolve(sendConfig['entry']);
  const fd = statSync(p);
  if (fd.isDirectory()) {
    sendConfig['appDir'] = p;
  } else if (fd.isFile()) {

    const dir = dirname(sendConfig['entry']);

    throw new Error(`Pandora.js can only start a Pandora.js project directory, like [ pandora ${command}${
      dir === '.' ? ' ./' : ' ' + dir + '/'
    } ]\nYou can use [ pandora init ${sendConfig['entry']} ] to init a Pandora.js project`);

    // sendConfig['entryFile'] = p;
    // sendConfig['appDir'] = currentPath;

  }

  if(cliConfig.name) {
    sendConfig.appName = cliConfig.name;
  }

  if(sendConfig.env) {
    try {
      const envMap = {};
      const splitEnv = sendConfig.env.split(' ');
      for(const item of splitEnv) {
        const execRes = /^(.*?)=(.*)$/.exec(item);
        const key = execRes[1];
        const value = execRes[2];
        envMap[key] = value;
      }
      sendConfig.globalEnv = envMap;
    } catch (err) {
      console.error(err);
    }
  }

  if(sendConfig['argv']) {
    sendConfig.globalArgv = sendConfig.argv.split(' ');
  }

  const sendConfig2nd = {};
  for(const key of ['appName', 'appDir',
    // 不能传递过去，会覆盖或激活默认定义的进程
    // 'entryFileBaseDir', 'entryFile', 'scale',
    'globalEnv', 'globalArgv']) {
    if(sendConfig.hasOwnProperty(key)) {
      sendConfig2nd[key] = sendConfig[key];
    }
  }

  return sendConfig2nd;

}
