'use strict';

const xorshift = require('xorshift');
const debug = require('debug')('PandoraMetrics:TraceUtil');

export function getRandom64() {
  let randint = xorshift.randomint();
  let buf = new Buffer(8);
  buf.writeUInt32BE(randint[0], 0);
  buf.writeUInt32BE(randint[1], 4);

  return buf.toString('hex');
}

export function convertObjectToTags(object) {
  const tags = [];

  Object.keys(object).forEach((key) => {
    let value = object[key];

    tags.push({key, value});
  });

  return tags;
}

export function hasOwn(obj, key) {
  return Object.hasOwnProperty.call(obj, key);
}

export function setInternalProperty(obj, name, val) {
  if (!obj || !name) {
    debug('Not setting property; object or name is missing.');
    return obj;
  }

  try {
    if (!hasOwn(obj, name)) {
      Object.defineProperty(obj, name, {
        enumerable: false,
        writable: true,
        value: val
      });
    } else {
      obj[name] = val;
    }
  } catch (err) {
    debug('Failed to set property "%s" to %j', name, val, err);
  }
  return obj;
}