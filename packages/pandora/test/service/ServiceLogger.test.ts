import mm = require('mm');
import {expect} from 'chai';
import ServiceLogger from '../../src/service/ServiceLogger';
import {homedir} from 'os';

describe('ServiceLogger', function () {

  let logger: ServiceLogger = null;

  it('should create logger be ok', () => {
    logger = new ServiceLogger({
      context: {
        appName: 'testApp',
        processName: 'worker',
      },
      getServiceId: () => {
        return 'lala';
      }
    });
    expect((<any> logger).logger.options.file).to.be.equal(homedir() + '/logs/testApp/service.log');
  });

  it('should doPrefix() be ok', () => {
    const res = logger.doPrefix(['test string']);
    expect(res[0]).to.be.equal('[serviceName: lala, processName: worker] test string');
  });

  it('should debug() be ok', () => {
    let did = false;
    mm(logger, 'logger', {
      debug() {
        did = true;
      }
    });
    logger.debug('msg');
    expect(did).to.be.equal(true);
    mm.restore();
  });

  it('should warn() be ok', () => {
    let did = false;
    mm(logger, 'logger', {
      warn() {
        did = true;
      }
    });
    logger.warn('msg');
    expect(did).to.be.equal(true);
    mm.restore();
  });

  it('should info() be ok', () => {
    let did = false;
    mm(logger, 'logger', {
      info() {
        did = true;
      }
    });
    logger.info('msg');
    expect(did).to.be.equal(true);
    mm.restore();
  });

  it('should error() be ok', () => {
    let did = false;
    mm(logger, 'logger', {
      error() {
        did = true;
      }
    });
    logger.error('msg');
    expect(did).to.be.equal(true);
    mm.restore();
  });

  it('should log() be ok', () => {
    let did = false;
    mm(logger, 'logger', {
      info() {
        did = true;
      }
    });
    logger.log('msg');
    expect(did).to.be.equal(true);
    mm.restore();
  });

  it('should write() be ok', () => {
    let did = false;
    mm(logger, 'logger', {
      write() {
        did = true;
      }
    });
    logger.write('msg');
    expect(did).to.be.equal(true);
    mm.restore();
  });

});
