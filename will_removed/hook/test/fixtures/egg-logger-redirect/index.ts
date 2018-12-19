'use strict';

import { RunUtil } from '../../RunUtil';
const { EggLoggerPatcher } = require('../../../src/patch/EggLogger');
const eggLoggerPatcher = new EggLoggerPatcher();
const assert = require('assert');

RunUtil.run(function(done) {
  eggLoggerPatcher.run();

  const Logger = require('egg-logger').Logger;
  const _originLog = Logger.prototype.log;
  let times = 0;
  Logger.prototype.log = function() {
    times ++;

    return _originLog.apply(this, arguments);
  };

  const logger = new Logger();
  const errorLogger = new Logger();
  logger.redirect('error', errorLogger);

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_LOGGER', (info: any) => {
    assert(info.message === 'test');
    assert(times === 3);

    Logger.prototype.log = _originLog;
    done();
  });

  logger.info('info test');
  logger.error(new Error('test'));
});
