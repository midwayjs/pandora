import * as _ from 'lodash';
import * as uuid from 'uuid';
import {join, dirname} from 'path';
import {lstatSync, readlinkSync} from 'fs';
const Module = require('module');

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