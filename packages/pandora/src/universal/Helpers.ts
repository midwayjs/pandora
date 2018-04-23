'use strict';
import {dirname, join, resolve} from 'path';
import {statSync} from 'fs';
import {PANDORA_GLOBAL_CONFIG} from '../const';
import {GlobalConfigProcessor} from './GlobalConfigProcessor';
const extend = require('extend');
const util = require('util');
const is = require('is-type-of');

export function calcAppName(dir?) {
  let ret;
  try {
    const pkg = require(join(process.cwd(), 'package.json'));
    pkg.name.toString();
    ret = removePkgNameScope(pkg.name);
  } catch (err) {
    ret = null;
  }
  if (!ret && dir) {
    ret = dir.split('/').slice(-1)[0] || null;
  }
  return ret;
}

export function removePkgNameScope(pkgName: string) {
  return pkgName.replace(/^@[^\/]*\//, '');
}

export function attachEntryParams(command, cliConfig, defaultConfig = {}): any {

  const currentPath = process.cwd();
  let pandoraConfig;
  try {
    const pandoraAttachConfig = require(`${currentPath}/package.json`)['pandora'];
    pandoraConfig = pandoraAttachConfig[command] || {};
    pandoraConfig['config'] = pandoraConfig['config'] || [];

    // set global config to environment
    pandoraConfig['config'].unshift(process.env[PANDORA_GLOBAL_CONFIG] || '');
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

  if(sendConfig['args']) {
    sendConfig.globalArgs = sendConfig.args.split(' ');
  }

  if(sendConfig['node-args']) {
    sendConfig.globalExecArgv = sendConfig['node-args'].split(' ');
  }

  for(const optName of ['inspect-port', 'inspect']) {
    if(sendConfig.hasOwnProperty(optName)) {
      const inspect: true | string = sendConfig[optName];
      if(optName === 'inspect' && inspect === '' || true === inspect) { // be an empty str
        sendConfig['inspector'] = true;
      } else if(typeof inspect === 'string' && inspect) {
        const {host, port} = parseInspectPort(inspect);
        sendConfig['inspector'] = { host, port, setPortOnly: optName === 'inspect-port' };
      }
      break;
    }
  }


  const sendConfig2nd = {};
  for(const key of ['appName', 'appDir', 'inspector',
    'globalEnv', 'globalArgs', 'globalExecArgv']) {
    if(sendConfig.hasOwnProperty(key)) {
      sendConfig2nd[key] = sendConfig[key];
    }
  }

  return sendConfig2nd;

}

export function parseInspectPort(inspect: string): { host: string, port: number } {
  const split = inspect.split(':');
  let port, host;
  if(split.length >= 2) {
    host = split[0];
    port = parseInt(split[1], 10);
  } else if(inspect.indexOf('.') > -1) {
    host = inspect;
  } else {
    port = parseInt(inspect, 10);
  }
  return { host, port };
}

export function convertObject(obj, ignore = []) {
  if (!is.array(ignore)) ignore = [ ignore ];
  for (const key of Object.keys(obj)) {
    obj[key] = convertValue(key, obj[key], ignore);
  }
  return obj;
}

export function convertValue(key, value, ignore = []) {
  if (is.nullOrUndefined(value)) return value;

  let hit;
  for (const matchKey of ignore) {
    if (typeof matchKey === 'string' && matchKey === key) {
      hit = true;
    } else if (is.regExp(matchKey) && matchKey.test(key)) {
      hit = true;
    }
  }
  if (!hit) {
    if (is.symbol(value) || is.regExp(value)) return value.toString();
    if (is.primitive(value)) return value;
    if (is.array(value)) return value;
  }

  // only convert recursively when it's a plain object,
  // o = {}
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return convertObject(value, ignore);
  }

  // support class
  const name = value.name || 'anonymous';
  if (is.class(value)) {
    return `<Class ${name}>`;
  }

  // support generator function
  if (is.function(value)) {
    if (is.generatorFunction(value)) return `<GeneratorFunction ${name}>`;
    if (is.asyncFunction(value)) return `<AsyncFunction ${name}>`;
    return `<Function ${name}>`;
  }

  const typeName = value.constructor.name;
  if (typeName) {
    if (is.buffer(value) || is.string(value)) return `<${typeName} len: ${value.length}>`;
    return `<${typeName}>`;
  }

  /* istanbul ignore next */
  return util.format(value);
}
