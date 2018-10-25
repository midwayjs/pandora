import { expect } from 'chai';
import { LongBucketCounter } from '../../../../src/common/metrics/LongBucketCounter';

describe('/test/unit/common/metrics/LongBucketCounter.test.ts', () => {

  it('testSingleUpdate', async () => {
    const bucketCounter = new LongBucketCounter(1, 5);
    for (let k = 1; k <= 7; k++) {
      for (let i = 0; i < k * 10; i++) {
        bucketCounter.update();
      }

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    }
    let expected = [ '70', '60', '50', '40', '30' ];
    expect(Array.from(bucketCounter.getBucketCountsValues().values())).to.deep.equal(expected);
  });

  it('testLatestIndexAtFirst', async () => {
    const bucketCounter = new LongBucketCounter(1, 5);
    for (let k = 1; k <= 6; k++) {
      for (let i = 0; i < k * 10; i++) {
        bucketCounter.update();
      }

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    }
    let expected = [ '60', '50', '40', '30', '20' ];
    expect(Array.from(bucketCounter.getBucketCountsValues().values())).to.deep.equal(expected);
  });

  it('testUpdateTotalCount', () => {
    const bucketCounter = new LongBucketCounter(10, 10, true);
    bucketCounter.update();
    bucketCounter.update();
    expect(bucketCounter.getCount()).to.equal('2');
  });

  it('testNotUpdateTotalCount', () => {
    const bucketCounter = new LongBucketCounter(10, 10, false);
    bucketCounter.update();
    bucketCounter.update();
    expect(bucketCounter.getCount()).to.equal('0');
  });
});
