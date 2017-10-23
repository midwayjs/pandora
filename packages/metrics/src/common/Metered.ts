import {Metric} from './Metric';
import {Counting} from './Counting';

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
