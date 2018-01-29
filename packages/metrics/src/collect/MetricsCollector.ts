import {MetricFilter, MetricName, MetricsCollectPeriodConfig} from '../common/index';
import {CollectMetricType, MetricObject} from './MetricObject';

export class MetricsCollector {
  protected metrics: Array<MetricObject> = [];
  protected globalTags = {};
  protected rateFactor: number;
  protected durationFactor: number;
  protected metricsCollectPeriodConfig = MetricsCollectPeriodConfig.getInstance();
  protected reportInterval = -1;
  /**
   * Use this filer to filter out any metric object that is not needed.
   */
  protected filter: MetricFilter;

  constructor(options: { globalTags, rateFactor, durationFactor, filter?, reportInterval?}) {
    this.globalTags = options.globalTags;
    this.rateFactor = options.rateFactor;
    this.durationFactor = options.durationFactor;
    this.filter = options.filter;
    this.reportInterval = options.reportInterval;
  }

  addMetricWithSuffix(name: MetricName, suffix: string, value: any, timestamp: number, type: CollectMetricType = CollectMetricType.GAUGE, interval: number = -1) {
    return this.addMetric(name.resolve(suffix), value, timestamp, type, interval);
  }

  addMetric(fullName: MetricName, value: any, timestamp: number, type: CollectMetricType = CollectMetricType.GAUGE, interval: number = -1) {

    let o: MetricObject = MetricObject.named(fullName.getKey())
      .withType(type)
      .withTimestamp(timestamp)
      .withValue(value)
      .withTags(Object.assign({}, this.globalTags, fullName.getTags()))
      .withLevel(fullName.getMetricLevel())
      .withInterval(interval)
      .build();

    if ((!this.filter || this.filter.matches(fullName, null))
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

  convertDuration(duration) {
    return duration * this.durationFactor;
  }

  protected addInstantCountMetric(instantCount: Map<number, number>, name: MetricName, countInterval: number, timestamp: number) {
    let start = this.getNormalizedStartTime(timestamp, countInterval);
    // only the latest instant rate, for compatibility
    if (instantCount.has(start)) {
      this.addMetricWithSuffix(name, 'bucket_count', instantCount.get(start), start,
        MetricObject.MetricType.DELTA, countInterval);
      this.addMetricWithSuffix(name, 'qps', this.rate(instantCount.get(start), countInterval),
        start, MetricObject.MetricType.GAUGE, countInterval);
    } else {
      this.addMetricWithSuffix(name, 'bucket_count', 0, start,
        MetricObject.MetricType.DELTA, countInterval);
      this.addMetricWithSuffix(name, 'qps', 0.0,
        start, MetricObject.MetricType.GAUGE, countInterval);
    }
  }

  public getNormalizedStartTime(current: number, interval: number) {
    return Math.floor((Math.floor(current / 1000) - interval) / interval) * interval * 1000;
  }

  public rate(data, interval) {
    if (interval === 0) return 0.0;
    return data / interval;
  }

  public ratio(data, total) {
    if (data > total) return 1.0;
    if (total === 0) return 0.0;
    return 1.0 * data / total;
  }
}
