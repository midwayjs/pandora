import {WeightedSnapshot} from '../../../../src/common';
import {expect} from 'chai';

describe('/test/unit/common/snapshot/WeightedSnapshot.test.ts', () => {
  let WeightedArray = [
    {
      value: 5,
      weight: 1
    },
    {
      value: 1,
      weight: 2
    },
    {
      value: 2,
      weight: 3
    },
    {
      value: 3,
      weight: 2
    },
    {
      value: 4,
      weight: 2
    }
  ];

  let snapshot = new WeightedSnapshot(WeightedArray);

  it('should small quantiles are the first value', function () {
    expect(snapshot.getValue(0.0)).to.equal(1.0);
  });

  it('should big quantiles are the last value', function () {
    expect(snapshot.getValue(1.0)).to.equal(5.0);
  });

  it('should throw error when parameter is not normal number', function () {
    expect(() => {
      snapshot.getValue(-0.5);
    }).to.throw();
    expect(() => {
      snapshot.getValue(NaN);
    }).to.throw();
    expect(() => {
      snapshot.getValue(1.5);
    }).to.throw();
  });

  it('should has a median', function () {
    expect(snapshot.getMedian()).to.equal(3);
  });

  it('should has a p75', function () {
    expect(snapshot.get75thPercentile()).to.equal(4.0);
  });

  it('should has a p95', function () {
    expect(snapshot.get95thPercentile()).to.equal(5.0);
  });

  it('should has a p98', function () {
    expect(snapshot.get98thPercentile()).to.equal(5.0);
  });

  it('should has a p99', function () {
    expect(snapshot.get99thPercentile()).to.equal(5.0);
  });

  it('should has a p999', function () {
    expect(snapshot.get999thPercentile()).to.equal(5.0);
  });

  it('should has values', function () {
    expect(snapshot.getValues()).to.include.members([1, 2, 3, 4, 5]);
  });

  it('should has a size', function () {
    expect(snapshot.size()).to.equal(5);
  });

  it('should calculate max value', function () {
    expect(snapshot.getMax()).to.equal(5);
  });

  it('should calculate min value', function () {
    expect(snapshot.getMin()).to.equal(1);
  });

  it('should calculate mean value', function () {
    expect(snapshot.getMean()).to.equal(2.7);
  });

  it('should calculate stdDev', function () {
    expect(snapshot.getStdDev().toFixed(4)).to.equal('1.2689');
  });
});
