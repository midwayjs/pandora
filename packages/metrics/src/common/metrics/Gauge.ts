import {MetricType} from '../MetricType';
import {Metric} from '../domain';

/**
 * <pre>
 * A gauge metric is an instantaneous reading of a particular value. To instrument a queue's depth,
 * for example:
 *
 * final Queue&lt;String&gt; queue = new ConcurrentLinkedQueue&lt;String&gt;();
 * final BaseGauge&lt;Integer&gt; queueDepth = new BaseGauge&lt;Integer&gt;() {
 *     public Integer getValue() {
 *         return queue.size();
 *     }
 * };
 *
 * 一种实时数据的度量，反映的是瞬态的数据，不具有累加性。
 * 具体的实现由具体定义，例如，获取当前jvm的活跃线程数
 * </pre>
 *
 * @param <T> the type of the metric's value
 */
export abstract class BaseGauge<T> implements Metric {
  type = MetricType.GAUGE;

  /**
   * Returns the metric's current value.
   *
   * @return the metric's current value
   */
  abstract getValue(): T;
}
