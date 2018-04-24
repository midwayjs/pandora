import { RunUtil } from '../../RunUtil';
const { GlobalPatcher } = require('../../../src/patch/Global');
const globalPatcher = new GlobalPatcher();
const assert = require('assert');
const pedding = require('pedding');

RunUtil.run(function(done) {
  done = pedding(3, done);
  globalPatcher.run();

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_LOGGER', (info: any) => {
    assert(info.message.indexOf('[Error] ') > -1);
    assert(['unhandledRejection', 'uncaughtException', 'console'].indexOf(info.path) > -1);
    done();
  });

  console.error(new Error('[Error] console.error'));
  function testUnhandledRejection() {
    Promise.reject(new Error('[Error] unhandledRejection'));
  }
  testUnhandledRejection();

  setTimeout(function() {
    throw new Error('[Error] uncaughtException');
  }, 1000);
});
