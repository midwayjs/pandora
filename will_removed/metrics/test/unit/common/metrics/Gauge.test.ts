import {BaseGauge} from '../../../../src/common/metrics/Gauge';
import {expect} from 'chai';

describe('/test/unit/common/metrics/Gauge.test.ts', () => {

  class TestGauge extends BaseGauge<number> {
    getValue(): number {
      return Math.random();
    }
  }

  it('test return new gauge', () => {
    let gauge = new TestGauge();
    expect(typeof gauge.getValue() === 'number').to.true;
  });

  it('test a new method to create gauge in typescript', () => {
    let gauge = <BaseGauge<number>> {
      getValue() {
        return Math.random();
      }
    };
    expect(typeof gauge.getValue() === 'number').to.true;
  });
});
