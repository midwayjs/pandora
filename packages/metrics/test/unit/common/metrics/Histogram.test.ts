import {expect} from 'chai';
import {BaseHistogram} from '../../../../src/common/metrics/Histogram';
import {ReservoirType} from '../../../../src/common/Reservoir';

describe('/test/unit/common/metrics/Histogram.test.ts', () => {

  function delay(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  it('updatesTheCountOnUpdates', () => {
    const histogram = new BaseHistogram();
    expect(histogram.getCount()).to.equal(0);
    histogram.update(1);
    expect(histogram.getCount()).to.deep.equal(1);
  });

  it('returnsTheSnapshotFromTheReservoir', async () => {
    let histogram = new BaseHistogram(ReservoirType.BUCKET, 1, 2);
    histogram.update(10);
    histogram.update(20);
    let snapshot = histogram.getSnapshot();
    expect(snapshot.getMean()).to.equal(15);
    await delay(2000);
    histogram.update(200);
    histogram.update(400);
    await delay(1000);
    let snapshot2 = histogram.getSnapshot();
    expect(snapshot2.getMean()).to.equal(300);
  });

});
