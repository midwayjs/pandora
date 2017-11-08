'use strict';
import {join, resolve} from 'path';
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

export function attachEntryParams(command, cliConfig, defaultConfig = {}) {
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
    console.log(err);
    pandoraConfig = {};
  }

  const sendConfig = extend(true, defaultConfig, pandoraConfig || {}, cliConfig);
  sendConfig['entry'] = sendConfig['entry'] || currentPath;

  try {
    const p = resolve(sendConfig['entry']);
    let fd = statSync(p);
    if (fd.isDirectory()) {
      sendConfig['appDir'] = p;
    } else if (fd.isFile()) {
      sendConfig['entryFile'] = p;
      sendConfig['appDir'] = currentPath;
    }
  } catch (err) {
    console.error(err);
  }

  return sendConfig;
}
