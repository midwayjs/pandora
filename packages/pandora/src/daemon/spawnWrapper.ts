'use strict';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
const wrap = require('spawn-wrap');
const globalConfigProcessor = GlobalConfigProcessor.getInstance();
const globalConfig = globalConfigProcessor.getAllProperties();
const patch = process.env.__pandora_hook = globalConfig['hook'];

if (patch) {
  require(patch);
}
wrap.runMain();
