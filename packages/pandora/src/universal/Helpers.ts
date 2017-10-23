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

