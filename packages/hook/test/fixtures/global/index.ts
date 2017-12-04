/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
const { GlobalPatcher } = require('../../../src/patch/global');
const globalPatcher = new GlobalPatcher();
const assert = require('assert');

RunUtil.run(function(done) {
  globalPatcher.run();

  process.on('PANDORA_PROCESS_MESSAGE_LOGGER', info => {
    assert(info.message === 'test');
    assert(info.path === 'console');
    done();
  });

  console.error(new Error('test'));
});
