import {MetricType} from '../MetricType';
import {Counting, Metric} from '../domain';

/**
 * <pre>
 * An incrementing and decrementing counter metric.
 *
 * 计数器型指标，适用于记录调用总量等类型的数据
 * </pre>
 */
export interface ICounter extends Metric, Counting {

  /**
   * Increment the counter by one.
   * 计数器加1
   */
  inc();

  /**
   * Increment the counter by {@code n}.
   * 计数器加n
   *
   * @param n the amount by which the counter will be increased
   */
  inc(n: number);

  /**
   * Decrement the counter by one.
   * 计数器减1
   */
  dec();

  /**
   * Decrement the counter by {@code n}.
   * 计数器减n
   *
   * @param n the amount by which the counter will be decreased
   */
  dec(n: number);

}

const MAX_COUNTER_VALUE = Math.pow(2, 32); // 4294967296

export class BaseCounter implements ICounter {

  count: number = 0;
  type = MetricType.COUNTER;

  inc(n?: number) {
    if (!n) {
      n = 1;
    }
    this.count += n;
    // Wrap counter if necessary.
    if (this.count > MAX_COUNTER_VALUE) {
      this.count -= (MAX_COUNTER_VALUE + 1);
    }
  }

  dec(n?: number) {
    if (!n) {
      n = 1;
    }
    this.count -= n;
    // Prevent counter from being decremented below zero.
    if (this.count < 0) {
      this.count = 0;
    }
  }

  clear() {
    this.count = 0;
  }

  getCount(): number {
    return this.count;
  }

}
