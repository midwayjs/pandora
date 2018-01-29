import {expect} from 'chai';
import {ErrorIndicator} from '../../../src/indicator/impl/ErrorIndicator';
import {LoggerMessageCollector} from '../../../src/util/MessageCollector';

let lastData;

class MyErrorIndicator extends ErrorIndicator {
  report(data) {
    lastData = data;
    super.report(data);
  };
}

describe('/test/unit/indicator/ErrorIndicator.test.ts', () => {

  let loggerCollector = new LoggerMessageCollector();
  let indicator = new MyErrorIndicator(loggerCollector);

  it('instance of correct', () => {
    expect(indicator).to.be.instanceOf(ErrorIndicator);
  });

  it('report Error indicator correct', () => {

    indicator.initialize();

    loggerCollector.report({
      method: 'error',
      from: 'worker',
      errType: 'Error',
      message: 'something error',
      stack: ''
    });

    expect(lastData.method).to.equal('error');
    expect(lastData.message).to.equal('something error');
  });

});
