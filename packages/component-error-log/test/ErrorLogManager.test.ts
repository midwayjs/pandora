import {expect} from 'chai';
import {ErrorLogManager} from '../src/ErrorLogManager';
describe('ErrorLogManager', function () {

  it('should record() and emit by poolSize limit be ok be ok', () => {
    const got = [];
    const errorLogManager: ErrorLogManager = new ErrorLogManager({
      poolSize: 50,
      interval: 1000 * 10
    });
    errorLogManager.on('dump', (list) => {
      got.push.apply(got, list);
    });
    errorLogManager.record({
      timestamp: Date.now(),
      message: 'test1'
    });
    expect(errorLogManager.pool.length).to.be.equal(1);
    expect(got.length).to.be.equal(0);

    for(let idx = 0; idx < 50; idx++) {
      errorLogManager.record({
        timestamp: Date.now(),
        message: 'test' + (idx + 2)
      });
    }
    expect(got.length).to.be.equal(50);
    expect(errorLogManager.pool.length).to.be.equal(1);
    expect(errorLogManager.pool[0]).to.deep.include({
      message: 'test51'
    });
  });


  it('should record() and emit by time interval be ok be ok', async () => {
    const got = [];
    const errorLogManager: ErrorLogManager = new ErrorLogManager({
      poolSize: 50,
      interval: 1000
    });
    errorLogManager.on('dump', (list) => {
      got.push.apply(got, list);
    });
    await errorLogManager.start();
    // start twice for else branch
    await errorLogManager.start();

    errorLogManager.record({
      timestamp: Date.now(),
      message: 'test1'
    });
    expect(errorLogManager.pool.length).to.be.equal(1);
    expect(got.length).to.be.equal(0);
    for(let idx = 0; idx < 30; idx++) {
      errorLogManager.record({
        timestamp: Date.now(),
        message: 'test' + (idx + 2)
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1.5 * 1000));
    expect(got.length).to.be.equal(31);
    expect(errorLogManager.pool.length).to.be.equal(0);

    await errorLogManager.stop();
    // start twice for else branch
    await errorLogManager.stop();
    expect(errorLogManager.intervalId == null).to.be.ok;
  });


  it('should avoid error when dumping be ok', async () => {
    const errorLogManager: ErrorLogManager = new ErrorLogManager({
      poolSize: 50,
      interval: 1000
    });
    errorLogManager.on('dump', (list) => {
      throw new Error('test Error');
    });
    errorLogManager.record({
      timestamp: Date.now(),
      message: 'test1'
    });
    errorLogManager.dump();
  });

});
