/**
 * A statistical snapshot of a {@link AbstractSnapshot}.
 */
import {Snapshot} from '../domain';

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

}
