'use strict';
process.env.NODE_ASYNC_HOOK_NO_WARNING = true;
const asyncWrap = process.binding('async_wrap');
const shimmer = require('shimmer');

shimmer.wrap(asyncWrap, 'setupHooks', function(setupHooks) {
  return function _setupHooks(hooks) {
    try {
      setupHooks.call(asyncWrap, hooks);
    } catch (err) {
      setupHooks.call(
        asyncWrap,
        hooks.init,
        hooks.pre,
        hooks.post,
        hooks.destroy
      );
    }
  };
});

module.exports = require('cls-hooked');
