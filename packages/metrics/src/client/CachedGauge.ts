import {Gauge} from './MetricsProxy';
import {Proxiable} from './domain';
import {MetricType} from '../common/MetricType';

export abstract class CachedGauge<T> implements Gauge<T>, Proxiable {

  static DEFAULT_TIMEOUT = 5000;

  type = MetricType.GAUGE;

  proxyMethod = [];

  reloadAt = Date.now();

  value: T;

  timeout; // 默认 cache 5s

  constructor(timeout?) {
    this.timeout = timeout || CachedGauge.DEFAULT_TIMEOUT;
  }

  /**
   * Loads the value and returns it.
   *
   * @return the new value
   */
  protected abstract loadValue(): T;

  getValue(): T {
    if (this.shouldLoad()) {
      this.value = this.loadValue();
    }
    return this.value;
  }

  shouldLoad() {
    let current = Date.now();

    if(current - this.reloadAt > this.timeout) {
      this.reloadAt = current;
      return true;
    }

    return false;
  }
}
