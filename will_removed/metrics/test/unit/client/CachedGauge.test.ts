import {expect} from 'chai';
import {CachedGauge} from '../../../src/client/CachedGauge';

class TestCachedGauge extends CachedGauge<number> {

  loadValue(): number {
    return process.cpuUsage().system;
  }
}

describe('/test/unit/client/CachedGauge.test.ts', () => {
  it('create a cached gauge and compare after cache timeout', (done) => {

    let gauge = new TestCachedGauge(150);
    let value = gauge.getValue();

    setTimeout(() => {
      expect(value === gauge.getValue()).to.true;
    }, 100);

    setTimeout(() => {
      expect(value !== gauge.getValue()).to.true;
      done();
    }, 200);

  });
});
