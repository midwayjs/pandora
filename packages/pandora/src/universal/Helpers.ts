'use strict';
import {join} from 'path';

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

export function mergeEntryParams(data) {
  const currentPath = process.cwd();
  let pandoraConfig;
  try {
    pandoraConfig = require(`${currentPath}/package.json`)['pandora'];
    // alias name
    pandoraConfig.appName = pandoraConfig.appName || pandoraConfig.name;
  } catch (err) {
    pandoraConfig = {};
  }
  return Object.assign(pandoraConfig || {}, data);
}
