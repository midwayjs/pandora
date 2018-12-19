import {MetricName} from './MetricName';
import {Metric} from './domain';

/**
 * A filter used to determine whether or not a metric should be reported, among other things.
 */
export interface Filter {

  /**
   * Returns {@code true} if the metric matches the filter; {@code false} otherwise.
   *
   * @param name      the metric's name
   * @param metric    the metric
   * @return {@code true} if the metric matches the filter
   */
  matches(name: MetricName,  metric: Metric): boolean;
}

export class AllFilter implements Filter {
  matches(name: MetricName, metric: Metric): boolean {
    return true;
  }
}

export abstract class MetricFilter implements Filter {
  static ALL = new AllFilter();
  abstract matches(name: MetricName,  metric: Metric): boolean;
}
