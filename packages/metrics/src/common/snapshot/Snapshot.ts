export interface Snapshot {

  /**
   * Returns the value at the given quantile.
   *
   * @param quantile    a given quantile, in {@code [0..1]}
   * @return the value in the distribution at {@code quantile}
   */
  getValue(quantile: number);

  /**
   * Returns the entire set of values in the snapshot.
   *
   * @return the entire set of values
   */
  getValues(): number [];

  /**
   * Returns the number of values in the snapshot.
   *
   * @return the number of values
   */
  size(): number;

  /**
   * Returns the median value in the distribution.
   *
   * @return the median value
   */
  getMedian(): number;

  /**
   * Returns the value at the 75th percentile in the distribution.
   *
   * @return the value at the 75th percentile
   */
  get75thPercentile(): number;

  /**
   * Returns the value at the 95th percentile in the distribution.
   *
   * @return the value at the 95th percentile
   */
  get95thPercentile(): number;

  /**
   * Returns the value at the 98th percentile in the distribution.
   *
   * @return the value at the 98th percentile
   */
  get98thPercentile(): number;

  /**
   * Returns the value at the 99th percentile in the distribution.
   *
   * @return the value at the 99th percentile
   */
  get99thPercentile(): number;

  /**
   * Returns the value at the 99.9th percentile in the distribution.
   *
   * @return the value at the 99.9th percentile
   */
  get999thPercentile(): number;

  /**
   * Returns the highest value in the snapshot.
   *
   * @return the highest value
   */
  getMax(): number;

  /**
   * Returns the arithmetic mean of the values in the snapshot.
   *
   * @return the arithmetic mean
   */
  getMean(): number;

  /**
   * Returns the lowest value in the snapshot.
   *
   * @return the lowest value
   */
  getMin(): number;

  /**
   * Returns the standard deviation of the values in the snapshot.
   *
   * @return the standard value
   */
  getStdDev(): number;

}
