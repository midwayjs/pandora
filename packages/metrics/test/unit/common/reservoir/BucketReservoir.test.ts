import {expect} from 'chai';
import {BucketCounter} from '../../../../src/common/metrics/BucketCounter';
import {BucketReservoir} from '../../../../src/common/reservoir/BucketReservoir';
import {Constants} from '../../../../src/common/Constants';

describe('/test/unit/common/reservoir/BucketReservoir.test.ts', () => {

  function delay(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  it('testAverageWhenBucketCountIsAvailable', async () => {
    let total = new BucketCounter(5, 10);
    let bucketReservoir = new BucketReservoir(5, 10, total);
    await delay(5000);
    bucketReservoir.update(10);
    bucketReservoir.update(20);
    total.update(2);
    await delay(2000);
    let snapshot = bucketReservoir.getSnapshot();
    expect(snapshot.getMean()).to.equal(15);
    expect(snapshot.get75thPercentile()).to.equal(Constants.NOT_AVAILABLE);
    expect(snapshot.get95thPercentile()).to.equal(Constants.NOT_AVAILABLE);
    expect(snapshot.get99thPercentile()).to.equal(Constants.NOT_AVAILABLE);
    expect(snapshot.getMax()).to.equal(Constants.NOT_AVAILABLE);
    expect(snapshot.getMin()).to.equal(Constants.NOT_AVAILABLE);

    // wait for 10 seconds
    await delay(10000);
    let s2 = bucketReservoir.getSnapshot();
    // should down to 0
    expect(s2.getMean()).to.equal(0);
  });

  it('test getNormalizedStartTime method', () => {
    class BucketReservoirTest extends BucketReservoir {
      getNormalizedStartTime(startTime) {
        return super.getNormalizedStartTime(startTime);
      }
    }

    let total = new BucketCounter(5, 10);
    let bucketReservoir = new BucketReservoirTest(5, 10, total);

    expect(bucketReservoir.getNormalizedStartTime(7000)).to.equal(0);
    expect(bucketReservoir.getNormalizedStartTime(17000)).to.equal(10000);

  });

});
