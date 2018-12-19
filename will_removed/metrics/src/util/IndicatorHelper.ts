import * as cp from 'child_process';

const debug = require('debug')('metrics:indicator_helper');

export function runScript(pl) {
  return new Promise((resolve, reject) => {
    cp.exec(`/usr/bin/perl ${pl}`, {
      timeout: 10000,
    }, (error, stdout, stderr) => {

      if (error) {
        debug(`exec error: ${error}`);
        return reject(error);
      }

      let result;
      try {
        result = JSON.parse(stdout);
      } catch (err) {
        debug(error);
        return reject(err);
      }

      resolve(result);
    });
  });
}

// borrowed from: https://github.com/lodash/lodash/blob/master/startsWith.js
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
