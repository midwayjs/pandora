import {BaseMeter} from '../../../../src/common';
import {expect} from 'chai';

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
//
// function elapseMinute(ewma) {
//   for (let i = 1; i <= 12; i++) {
//     ewma.tick();
//   }
// }

describe('/test/unit/common/metrics/meter.test.ts', () => {
  it('should properly record rate and count.', async () => {
    let meter = new BaseMeter(1);
    meter.mark(1);
    meter.mark(1);
    meter.mark(1);
    await delay(3000);
    expect(meter.getCount()).to.equal(3);
    let meanRate = meter.getMeanRate();
    expect(meanRate > 0.99 && meanRate <= 1).to.be.true;
    expect(meter.getOneMinuteRate()).to.equal(0);
    expect(meter.getFiveMinuteRate()).to.equal(0);
    expect(meter.getFifteenMinuteRate()).to.equal(0);

    meter.mark(1);
    meter.mark(1);
    meter.mark(1);
    await delay(3000);
    expect(meter.getCount()).to.equal(6);
    meanRate = meter.getMeanRate();
    expect(meanRate > 0.99 && meanRate <= 1).to.be.true;
    let m1 = meter.getOneMinuteRate();
    expect(m1 > 1.1 && m1 <= 1.2).to.be.true;

    let m5 = meter.getFiveMinuteRate();
    expect(m5 > 1.1 && m5 <= 1.2).to.be.true;

    let m15 = meter.getFifteenMinuteRate();
    expect(m15 > 1.1 && m15 <= 1.2).to.be.true;
  });
});
