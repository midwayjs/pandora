import {expect} from 'chai';
import LoggerBroker = require('../../src/universal/LoggerBroker');
import {homedir, EOL} from 'os';

describe('LoggerBroker', function () {

  it('should consoleLogger be ok', () => {
    const consoleLogger = LoggerBroker.consoleLogger;
    expect(consoleLogger.info).to.ok;
    expect(consoleLogger.debug).to.ok;
    expect(consoleLogger.warn).to.ok;
    expect(consoleLogger.error).to.ok;
  });

  it('should getDaemonLogger() be ok', () => {
    const daemonLogger: any = LoggerBroker.getDaemonLogger();
    expect(daemonLogger.options.file).to.be.equal(homedir() + '/logs/pandorajs/daemon.log');
    expect(daemonLogger.info).to.ok;
    expect(daemonLogger.debug).to.ok;
    expect(daemonLogger.warn).to.ok;
    expect(daemonLogger.error).to.ok;
  });

  it('should getDaemonStdoutLoggerPath() be ok', () => {
    const daemonStdoutLoggerPath = LoggerBroker.getDaemonStdoutLoggerPath();
    expect(daemonStdoutLoggerPath).to.be.equal(homedir() + '/logs/pandorajs/daemon_std.log');
  });

  it('should createAppLogger() be ok', () => {
    const appLogger: any = LoggerBroker.createAppLogger('a', 'b');
    expect(appLogger.options.file).to.be.equal(homedir() + '/logs/a/b.log');
    expect(appLogger.info).to.ok;
    expect(appLogger.debug).to.ok;
    expect(appLogger.warn).to.ok;
    expect(appLogger.error).to.ok;
  });

  it('should getAppLogPath() be ok', () => {
    expect(LoggerBroker.getAppLogPath('a', 'b')).to.be.equal(homedir() + '/logs/a/b.log');
  });

  it('should removeEOL() be ok', () => {
    expect(LoggerBroker.removeEOL('test' + EOL)).to.be.equal('test');
  });

});
