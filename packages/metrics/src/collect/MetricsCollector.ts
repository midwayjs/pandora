import {MetricName, MetricFilter} from '../common/index';
import {MetricObject, CollectMetricType} from './MetricObject';

export class MetricsCollector {
  protected metrics: Array<MetricObject> = [];
  protected globalTags = {};
  protected rateFactor: number;
  protected durationFactor: number;
  /**
   * Use this filer to filter out any metric object that is not needed.
   */
  protected filter: MetricFilter;

  constructor(globalTags, rateFactor, durationFactor, filter?) {
    this.globalTags = globalTags;
    this.rateFactor = rateFactor;
    this.durationFactor = durationFactor;
    this.filter = filter;
  }

  addMetricWithSuffix(name: MetricName, suffix: string, value: any, timestamp: number, type: CollectMetricType = CollectMetricType.GAUGE, interval: number = -1) {
    return this.addMetric(name.resolve(suffix), value, timestamp, type, interval);
  }

  addMetric(fullName: MetricName, value: any, timestamp: number, type: CollectMetricType = CollectMetricType.GAUGE, interval: number = -1) {

    let o: MetricObject = MetricObject.named(fullName.getKey())
      .withType(type)
      .withTimestamp(timestamp)
      .withValue(value)
      .withTags(Object.assign(this.globalTags, fullName.getTags()))
      .withLevel(fullName.getMetricLevel())
      .withInterval(interval)
      .build();

    if ((!this.filter || this.filter.matches(MetricName.build(o.metric), null))
      && o.value != null) {
      this.metrics.push(o);
    }
    return this;
  }

  build() {
    return this.metrics;
  }

  convertRate(rate) {
    return rate * this.rateFactor;
  }
}
