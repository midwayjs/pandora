'use strict';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
const wrap = require('spawn-wrap');
const hook = require('module-hook');
const shimmer = require('shimmer');
import {resolve} from 'path';

const globalConfigProcessor = GlobalConfigProcessor.getInstance();
const globalConfig = globalConfigProcessor.getAllProperties();
const hooks = globalConfig['hooks'];

/**
 * hooks: {
 *   logger: Hooks.logger
 * }
 */
for(const hookName in hooks) {
  if(hooks[hookName]) {
    try {
      const m = require(resolve(hooks[hookName]));
      m(hook, shimmer);
      console.log(`${hookName} hook enabled`);
    } catch (err) {
      console.log(err);
      console.log(`enable ${hookName} hook went wrong`);
    }
  } else {
    console.log(`${hookName} hook disabled`);
  }
}

wrap.runMain();
