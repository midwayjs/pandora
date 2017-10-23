import {expect} from 'chai';
import {ErrorIndicator} from '../../../src/indicator/impl/ErrorIndicator';
import EventEmitter = require('events');

let lastData;

class LoggerManager extends EventEmitter {
}

class MyErrorIndicator extends ErrorIndicator {
  report(data) {
    lastData = data;
    super.report(data);
  };
}

describe('/test/unit/indicator/ErrorIndicator.test.ts', () => {

  let loggerManager = new LoggerManager();
  let indicator = new MyErrorIndicator(loggerManager);

  it('instance of correct', () => {
    expect(indicator).to.be.instanceOf(ErrorIndicator);
  });

  it('report Error indicator correct', () => {

    indicator.initialize();

    loggerManager.emit('message', {
      method: 'error',
      from: 'worker',
      errType: 'Error',
      message: 'something error',
      stack: ''
    });

    expect(lastData.method).to.be.equal('error');
    expect(lastData.message).to.be.equal('something error');
  });

});
