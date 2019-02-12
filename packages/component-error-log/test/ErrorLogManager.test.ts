import 'mocha';
import {expect} from 'chai';
import {ErrorLogManager} from '../src/ErrorLogManager';
describe('ErrorLogManager', function () {

  it('should record() and emit  be ok', () => {
    const got = [];
    const errorLogManager: ErrorLogManager = new ErrorLogManager({logger: console});
    errorLogManager.on('dump', (list) => {
      got.push.apply(got, list);
    });
    for(let idx = 0; idx < 50; idx++) {
      errorLogManager.record({
        timestamp: Date.now(),
        message: 'test' + (idx + 2)
      });
    }
    expect(got.length).to.be.equal(50);
  });


  it('should avoid error when dumping be ok', async () => {
    const errorLogManager: ErrorLogManager = new ErrorLogManager({logger: console});
    errorLogManager.on('dump', (list) => {
      throw new Error('test Error');
    });
    errorLogManager.record({
      timestamp: Date.now(),
      message: 'test1'
    });
  });

});
