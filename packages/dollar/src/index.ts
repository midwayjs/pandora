import * as _ from 'lodash';
import * as uuid from 'uuid';
import {join, dirname} from 'path';
import {lstatSync, readlinkSync} from 'fs';
const Module = require('module');
const colors = require('colors');

export const TemplatePattern = /{{([\s\S]+?)}}/g;

export function template(str: string, options): string {
  return _.template(str, {
    interpolate: new RegExp(TemplatePattern)
  })(options);
}

export function getObjectByPath(obj: any, path: string, defaultValue = undefined): any {
  return _.get(obj, path, defaultValue);
}

export function mergeProperties(obj, source) {
  return _.defaultsDeep(obj, source);
}

export function genereateUUID(): string {
  return uuid.v4();
}

export const promise = {
  fromCallback(cb): Promise<any> {
    return new Promise(function(resolve, reject) {
      cb(function(e) {
        if(e) {
          return reject(e);
        }
        resolve();
      });
    });
  },
  delay(ms: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
  defer() {
    let resolve, reject;
    const promise = new Promise(function(_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });
    return {
      resolve: resolve,
      reject: reject,
      promise: promise
    };
  }
};

/**
 * 以后标记废弃接口用
 * @param msg
 */
export function alert(msg) {
  try {
    require('child_process').execSync(`osascript -e 'tell app "System Events" to display dialog ${JSON.stringify(msg.toString())}'`);
  } catch(err) {
    // dismiss
  }
}

export function makeRequire(dir) {
  if(!Module._extensions['.$requireAnyWhere']) {
    Module._extensions['.$requireAnyWhere'] = () => {};
  }
  const fakePath = join(dir, 'pandora.$requireAnyWhere');
  const fakeModule = new Module(fakePath);
  fakeModule.load(fakePath);
  return fakeModule.require.bind(fakeModule);
}

export function resolveSymlink(targetPath) {
  if(lstatSync(targetPath).isSymbolicLink()) {
    const linkTo = join(dirname(targetPath), readlinkSync(targetPath));
    return resolveSymlink(linkTo);
  }
  return targetPath;
}

export class MyConsole extends console.Console {
  constructor() {
    super(process.stdout, process.stderr);
  }
  important(msg, ...more) {
    super.log(colors.green(`[Pandora.js] ** ${msg} **`), ...more);
  }
  error(msg, ...more) {
    super.error(colors.red(`[Pandora.js] ${msg}`), ...more);
    if(msg.stack) {
      super.error(colors.red(msg.stack), ...more);
    }
  }
  warn(msg, ...more) {
    super.warn(colors.yellow(`[Pandora.js] ${msg}`), ...more);
  }
  info(msg, ...more) {
    super.info(colors.cyan(`[Pandora.js] ${msg}`), ...more);
  }
}

export const consoleLogger = new MyConsole();

export function startsWith(str, target, position = 0) {
  const {length} = str;
  if (position < 0) {
    position = 0;
  } else if (position > length) {
    position = length;
  }
  target = `${target}`;
  return str.slice(position, position + target.length) === target;
}

export function extractInt(str) {
  try {
    return parseInt(str.match(/\d+/g)[0], 10);
  } catch (e) {
    return null;
  }
}
