import {Snapshot} from './Snapshot';

const DEFAULT_PERCENTILES = [0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.98, 0.99, 0.999];

/**
 * A statistical snapshot of a {@link AbstractSnapshot}.
 */
export abstract class AbstractSnapshot implements Snapshot {

  abstract getValue(quantile: number);
  abstract getValues(): number [];
  abstract size(): number;
  abstract getMax(): number;
  abstract getMean(): number;
  abstract getMin(): number;
  abstract getStdDev(): number;

  /**
   * Returns the median value in the distribution.
   *
   * @return the median value
   */
  getMedian(): number {
    return this.getValue(0.5);
  }

  /**
   * Returns the value at the 75th percentile in the distribution.
   *
   * @return the value at the 75th percentile
   */
  get75thPercentile(): number {
    return this.getValue(0.75);
  }

  /**
   * Returns the value at the 95th percentile in the distribution.
   *
   * @return the value at the 95th percentile
   */
  get95thPercentile(): number {
    return this.getValue(0.95);
  }

  /**
   * Returns the value at the 98th percentile in the distribution.
   *
   * @return the value at the 98th percentile
   */
  get98thPercentile(): number {
    return this.getValue(0.98);
  }

  /**
   * Returns the value at the 99th percentile in the distribution.
   *
   * @return the value at the 99th percentile
   */
  get99thPercentile(): number {
    return this.getValue(0.99);
  }

  /**
   * Returns the value at the 99.9th percentile in the distribution.
   *
   * @return the value at the 99.9th percentile
   */
  get999thPercentile(): number {
    return this.getValue(0.999);
  }

  // Pass an array of percentiles, e.g. [0.5, 0.75, 0.9, 0.99]
  percentiles(percentiles) {
    if (!percentiles) {
      percentiles = DEFAULT_PERCENTILES;
    }

    let values = this.getValues().map((v: any) => {
      return parseFloat(v);
    }).sort((a, b) => {
      return a - b;
    });

    let scores = {},
      percentile,
      pos,
      lower,
      upper;

    for (let i = 0; i < percentiles.length; i++) {
      pos = percentiles[i] * (values.length + 1);
      percentile = percentiles[i];
      if (pos < 1) {
        scores[percentile] = values[0];
      }
      else if (pos >= values.length) {
        scores[percentile] = values[values.length - 1];
      }
      else {
        lower = values[Math.floor(pos) - 1];
        upper = values[Math.ceil(pos) - 1];
        scores[percentile] = lower + (pos - Math.floor(pos)) * (upper - lower);
      }
    }
    return scores;
  }

}
