'use strict';
import { RunUtil } from '../../RunUtil';
const { EggLoggerPatcher } = require('../../../src/patch/egg-logger');
const eggLoggerPatcher = new EggLoggerPatcher();
const assert = require('assert');

RunUtil.run(function(done) {
  eggLoggerPatcher.run();

  const Logger = require('egg-logger').Logger;
  const FileTransport = require('egg-logger').FileTransport;
  const logger = new Logger();
  logger.set('file', new FileTransport({
    file: './test.log',
    level: 'INFO',
  }));

  process.on('PANDORA_PROCESS_MESSAGE_LOGGER', info => {
    assert(info.message === 'test');
    assert(info.path === './test.log');
    assert(info.ip);
    assert(info.host);
    assert(info.pid);
    done();
  });

  logger.error(new Error('test'));
});
