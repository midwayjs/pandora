'use strict';
const wrap = require('spawn-wrap');
const patch = process.env.__pandora_hook;
if (patch) {
  require(patch);
}
wrap.runMain();
