export interface Metric {
  type: string;
}

export interface WeightSample {
  weight: number;
  value: number;
}

export interface Counting {
  /**
   * Returns the current count.
   *
   * @return the current count
   */
  getCount(): number;
}


/**
 * An object which maintains mean and exponentially-weighted rate.
 */
export interface Metered extends Metric, Counting {

  /**
   * Returns the number of events which have been marked.
   *
   * @return the number of events which have been marked
   */
  getCount(): number;

  /**
   * Get the accurate number per collecting interval
   * @return an long array, each contains the number of events, keyed by timestamp in milliseconds
   */
  getInstantCount(): Map<number, number>;

  /**
   * Get the accurate number per collecting interval since (including) the start time
   * @param startTime the start time of the query
   * @return an long array, each contains the number of events, keyed by timestamp in milliseconds
   */
  getInstantCount(startTime: number): Map<number, number>;

  /**
   * Get the collecting interval
   * @return the collecting interval
   */
  getInstantCountInterval(): number;

  /**
   * Returns the fifteen-minute exponentially-weighted moving average rate at which events have
   * occurred since the meter was created.
   * <p/>
   * This rate has the same exponential decay factor as the fifteen-minute load average in the
   * {@code top} Unix command.
   *
   * @return the fifteen-minute exponentially-weighted moving average rate at which events have
   *         occurred since the meter was created
   */
  getFifteenMinuteRate(): number;

  /**
   * Returns the five-minute exponentially-weighted moving average rate at which events have
   * occurred since the meter was created.
   * <p/>
   * This rate has the same exponential decay factor as the five-minute load average in the {@code
   * top} Unix command.
   *
   * @return the five-minute exponentially-weighted moving average rate at which events have
   *         occurred since the meter was created
   */
  getFiveMinuteRate(): number;

  /**
   * Returns the mean rate at which events have occurred since the meter was created.
   *
   * @return the mean rate at which events have occurred since the meter was created
   */
  getMeanRate(): number;

  /**
   * Returns the one-minute exponentially-weighted moving average rate at which events have
   * occurred since the meter was created.
   * <p/>
   * This rate has the same exponential decay factor as the one-minute load average in the {@code
   * top} Unix command.
   *
   * @return the one-minute exponentially-weighted moving average rate at which events have
   *         occurred since the meter was created
   */
  getOneMinuteRate(): number;
}

/**
 * An object which samples values.
 */
export interface Sampling {
  /**
   * Returns a snapshot of the values.
   *
   * @return a snapshot of the values
   */
  getSnapshot(): Snapshot;
}

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

