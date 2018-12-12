'use strict';
import {dirname, join, resolve} from 'path';
import {statSync} from 'fs';
import {ApplicationRepresentation} from '../domain';
import {consoleLogger} from 'pandora-dollar';

export function calcAppName(dir?) {

  let ret;
  try {
    const pkg = require(join(dir, 'package.json'));
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

export function cliParamsToApplicationRepresentation(command, cliConfig): any {

  const result: Partial<ApplicationRepresentation> = {};
  const cwd = process.cwd();
  const targetPath = result.appDir = cliConfig.targetPath || cwd;

  const appDir = resolve(targetPath);
  if (!statSync(appDir).isDirectory()) {
    const dir = dirname(targetPath);
    throw new Error(`Pandora.js can only start a Pandora.js project directory, like [ pandora ${command}${
      dir === '.' ? ' ./' : ' ' + dir + '/'
      } ]\nYou can use [ pandora init ${targetPath} ] to init a Pandora.js project`);
  }
  result.appDir = appDir;

  result.appName = cliConfig.name || calcAppName(appDir);

  if(cliConfig.env) {
    try {
      const envMap = {};
      const splitEnv = cliConfig.env.split(' ');
      for(const item of splitEnv) {
        const execRes = /^(.*?)=(.*)$/.exec(item);
        const key = execRes[1];
        const value = execRes[2];
        envMap[key] = value;
      }
      result.globalEnv = envMap;
    } catch (err) {
      consoleLogger.error(err);
    }
  }

  if(cliConfig.args) {
    result.globalArgs = cliConfig.args.split(' ');
  }

  if(cliConfig['node-args']) {
    result.globalExecArgv = cliConfig['node-args'].split(' ');
  }

  for(const optName of ['inspect-port', 'inspect']) {
    if(cliConfig.hasOwnProperty(optName)) {
      const inspect: true | string = cliConfig[optName];
      if(optName === 'inspect' && inspect === '' || true === inspect) { // be an empty str
        result.inspector = true;
      } else if(typeof inspect === 'string' && inspect) {
        const {host, port} = parseInspectPort(inspect);
        result.inspector = { host, port, setPortOnly: optName === 'inspect-port' };
      }
      break;
    }
  }

  return result;

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

