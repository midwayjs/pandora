import {Metric} from './Metric';
import {MetricType} from './MetricType';

export abstract class MetricSet implements Metric {

  type: string = MetricType.METRICSET;

  /**
   * A map of metric names to metrics.
   *
   * @return the metrics
   */
  abstract getMetrics(): Array<{
    name,
    metric
  }>;
}
