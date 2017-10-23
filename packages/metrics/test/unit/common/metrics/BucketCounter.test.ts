import {expect} from 'chai';
import {BucketCounter} from '../../../../src/common/metrics/BucketCounter';

describe('/test/unit/common/metrics/BucketCounter.test.ts', () => {

  it('testSingleUpdate', async () => {
    const bucketCounter = new BucketCounter(1, 5);
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
    let expected = [70, 60, 50, 40, 30];
    expect(Array.from(bucketCounter.getBucketCounts().values())).to.deep.equal(expected);
  });

  it('testLatestIndexAtFirst', async () => {
    const bucketCounter = new BucketCounter(1, 5);
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
    let expected = [60, 50, 40, 30, 20];
    expect(Array.from(bucketCounter.getBucketCounts().values())).to.deep.equal(expected);
  });

  it('testUpdateTotalCount', () => {
    const bucketCounter = new BucketCounter(10, 10, true);
    bucketCounter.update();
    bucketCounter.update();
    expect(bucketCounter.getCount()).to.equal(2);
  });

  it('testNotUpdateTotalCount', () => {
    const bucketCounter = new BucketCounter(10, 10, false);
    bucketCounter.update();
    bucketCounter.update();
    expect(bucketCounter.getCount()).to.equal(0);
  });
});
