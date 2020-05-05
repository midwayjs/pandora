import * as xorshift from 'xorshift';
import { LogItem } from './types';

/**
 * random id
 * inspired by:
 * https://github.com/jaegertracing/jaeger-client-node/blob/d244bc0207db3a1e1509e4f8d2208f886363d100/src/util.js#L50
 */
export function getRandom64() {
  let randint = xorshift.randomint();
  let buf = new Buffer(8);
  buf.writeUInt32BE(randint[0], 0);
  buf.writeUInt32BE(randint[1], 4);

  return buf.toString('hex');
}

export function convertObjectToArray(object: {[key: string]: string}): LogItem[] {
  const ret = [];

  Object.keys(object).forEach((key) => {
    if (object.hasOwnProperty(key)) {
      const value = object[key];
      ret.push({key, value});
    }
  });

  return ret;
}

export function mapToObj(map: Map<string, any>): Object {
  const obj = Object.create(null);

  for (let [k, v] of map) {
    obj[k] = v;
  }

  return obj;
}
