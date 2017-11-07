'use strict';
import {join} from 'path';
import {PANDORA_GLOBAL_CONFIG} from '../const';
import {GlobalConfigProcessor} from './GlobalConfigProcessor';

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

export function attachEntryParams(command, data) {
  const currentPath = process.cwd();
  let pandoraConfig;
  try {
    const pandoraAttachConfig = require(`${currentPath}/package.json`)['pandora'];
    pandoraConfig = pandoraAttachConfig[command] || {};

    // set global config to environment
    pandoraConfig['config'].push(process.env[PANDORA_GLOBAL_CONFIG] || '');
    process.env[PANDORA_GLOBAL_CONFIG] = pandoraConfig['config'].join(GlobalConfigProcessor.GLOBAL_PACKAGE_SPLIT);
  } catch (err) {
    pandoraConfig = {};
  }
  return Object.assign(pandoraConfig || {}, data);
}
