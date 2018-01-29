import {BaseTimer} from '../../../../src/common';
import {expect} from 'chai';

describe('/test/unit/common/metrics/Timer.test.ts', () => {

  let timer = new BaseTimer(5);

  it('should hasRates', function () {
    expect(timer.getCount()).to.equal(0);
    expect(timer.getMeanRate()).to.equal(0);
    expect(timer.getOneMinuteRate()).to.equal(0);
    expect(timer.getFiveMinuteRate()).to.equal(0);
    expect(timer.getFifteenMinuteRate()).to.equal(0);
  });

  it('should updatesTheCountOnUpdates', function () {
    timer.update(1);
    expect(timer.getCount()).to.equal(1);
  });
});
