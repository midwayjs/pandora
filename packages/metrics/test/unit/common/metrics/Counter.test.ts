import {expect} from 'chai';
import {BaseCounter} from '../../../../src/common/metrics/Counter';

describe('/test/unit/common/metrics/Counter.test.ts', () => {

  const counter = new BaseCounter();

  it('startsAtZero', () => {
    expect(counter.getCount()).to.equal(0);
  });

  it('incrementsByOne', () => {
    counter.inc();
    expect(counter.getCount()).to.equal(1);
  });

  it('incrementsByAnArbitraryDelta', () => {
    counter.inc(12);
    expect(counter.getCount()).to.equal(13);
  });

  it('decrementsByOne', () => {
    counter.dec();
    expect(counter.getCount()).to.equal(12);
  });

  it('decrementsByAnArbitraryDelta', () => {
    counter.dec(12);
    expect(counter.getCount()).to.equal(0);
  });
});
