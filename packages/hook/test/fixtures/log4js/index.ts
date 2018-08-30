'use strict';
import { RunUtil } from '../../RunUtil';
const { Log4jsPatcher } = require('../../../src/patch/Log4js');
const log4jsPatcher = new Log4jsPatcher();
const assert = require('assert');
const pedding = require('pedding');

RunUtil.run(function(done) {
  done = pedding(done, 3);

  log4jsPatcher.run();

  const log4js = require('log4js');

  log4js.configure({
    appenders: {
      flog: {
        type: 'file',
        filename: './log4js-test.log'
      },
      clog: {
        type: 'console'
      }
    },
    categories: {
      default: {
        appenders: ['flog'],
        level: 'info'
      }
    }
  });

  const fLogger = log4js.getLogger('flog');
  const cLogger = log4js.getLogger('clog');

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_LOGGER', (info: any) => {
    if (info.method === 'ERROR') {
      if (info.path === 'flog') {
        assert(info.message === 'log4js error object test');
      } else {
        assert(info.message === 'log4js error message test');
      }
    } else {
      assert(info.message === 'log4js warn message test');
      assert(info.path === 'clog');
    }
    done();
  });

  fLogger.info('log4js info test');
  fLogger.error(new Error('log4js error object test'));
  cLogger.warn('log4js warn message test');
  cLogger.error('log4js error message test');
});
