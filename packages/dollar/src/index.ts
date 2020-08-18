import { join, dirname } from 'path';
import { lstatSync, readlinkSync } from 'fs';
import { Module } from './module';
import * as colors from 'colors';

export const promise = {
  fromCallback(cb): Promise<any> {
    return new Promise((resolve, reject) => {
      cb(e => {
        if (e) {
          return reject(e);
        }
        resolve();
      });
    });
  },
  delay(ms: number): Promise<any> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },
  defer() {
    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    return {
      resolve: resolve,
      reject: reject,
      promise: promise,
    };
  },
};

export function makeRequire(dir) {
  if (!Module._extensions['.$requireAnyWhere']) {
    Module._extensions['.$requireAnyWhere'] = () => {};
  }
  const fakePath = join(dir, 'pandora.$requireAnyWhere');
  const fakeModule = new Module(fakePath);
  fakeModule.load(fakePath);
  return fakeModule.require.bind(fakeModule);
}

export function resolveSymlink(targetPath) {
  if (lstatSync(targetPath).isSymbolicLink()) {
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
    if (msg.stack) {
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

export const avoidLogger = {
  log() {},
  warn() {},
  error() {},
  info() {},
  important() {},
};

export function startsWith(str, target, position = 0) {
  const { length } = str;
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
