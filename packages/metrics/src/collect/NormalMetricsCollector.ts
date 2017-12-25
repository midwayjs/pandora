import {MetricsCollector} from './MetricsCollector';
import {BaseGauge, MetricName, ITimer, IHistogram, ICounter, IMeter} from '../common/index';
import {MetricObject} from './MetricObject';
import {BucketCounter, Snapshot} from '../common';

export class NormalMetricsCollector extends MetricsCollector {

  collectTimer(name: MetricName, timer: ITimer, timestamp: number) {
    let snapshot = timer.getSnapshot();
    this.addMetricWithSuffix(name, 'count', timer.getCount(), timestamp, MetricObject.MetricType.COUNTER)
      .addMetricWithSuffix(name, 'm1', this.convertRate(timer.getOneMinuteRate()), timestamp)
      .addMetricWithSuffix(name, 'm5', this.convertRate(timer.getFiveMinuteRate()), timestamp)
      .addMetricWithSuffix(name, 'm15', this.convertRate(timer.getFifteenMinuteRate()), timestamp)
      // convert duration
      .addMetricWithSuffix(name, 'max', this.convertDuration(snapshot.getMax()), timestamp)
      .addMetricWithSuffix(name, 'min', this.convertDuration(snapshot.getMin()), timestamp)
      .addMetricWithSuffix(name, 'mean', this.convertDuration(snapshot.getMean()), timestamp)
      .addMetricWithSuffix(name, 'rt', this.convertDuration(snapshot.getMean()), timestamp)
      .addMetricWithSuffix(name, 'stddev', this.convertDuration(snapshot.getStdDev()), timestamp)
      .addMetricWithSuffix(name, 'median', this.convertDuration(snapshot.getMedian()), timestamp)
      .addMetricWithSuffix(name, 'p75', this.convertDuration(snapshot.get75thPercentile()), timestamp)
      .addMetricWithSuffix(name, 'p95', this.convertDuration(snapshot.get95thPercentile()), timestamp)
      .addMetricWithSuffix(name, 'p99', this.convertDuration(snapshot.get99thPercentile()), timestamp);

    // instant count
    this.addInstantCountMetric(timer.getInstantCount(), name, timer.getInstantCountInterval(), timestamp);
  }

  collectHistogram(name: MetricName, histogram: IHistogram, timestamp: number) {
    let snapshot: Snapshot = histogram.getSnapshot();
    this.addMetricWithSuffix(name, 'count', histogram.getCount(), timestamp, MetricObject.MetricType.COUNTER)
      .addMetricWithSuffix(name, 'max', snapshot.getMax(), timestamp)
      .addMetricWithSuffix(name, 'min', snapshot.getMin(), timestamp)
      .addMetricWithSuffix(name, 'mean', snapshot.getMean(), timestamp)
      .addMetricWithSuffix(name, 'stddev', snapshot.getStdDev(), timestamp)
      .addMetricWithSuffix(name, 'median', snapshot.getMedian(), timestamp)
      .addMetricWithSuffix(name, 'p75', snapshot.get75thPercentile(), timestamp)
      .addMetricWithSuffix(name, 'p95', snapshot.get95thPercentile(), timestamp)
      .addMetricWithSuffix(name, 'p99', snapshot.get99thPercentile(), timestamp);
  }

  async collectGauge(name: MetricName, gauge: BaseGauge<any>, timestamp: number) {
    this.addMetric(name, await gauge.getValue(), timestamp, MetricObject.MetricType.GAUGE, -1);
  }

  collectCounter(name: MetricName, counter: ICounter, timestamp: number) {
    let normalizedName: MetricName = name.getKey().endsWith('count') ? name : name.resolve('count');
    this.addMetric(normalizedName, counter.getCount(), timestamp, MetricObject.MetricType.COUNTER, -1);

    if (counter instanceof BucketCounter) {
      let countInterval = (<BucketCounter> counter).getBucketInterval();
      // bucket count
      this.addInstantCountMetric((<BucketCounter>counter).getBucketCounts(), name, countInterval, timestamp);
    }
  }

  collectMeter(name: MetricName, meter: IMeter, timestamp: number) {
    this.addMetricWithSuffix(name, 'count', meter.getCount(), timestamp, MetricObject.MetricType.COUNTER)
    // convert rate
      .addMetricWithSuffix(name, 'm1', this.convertRate(meter.getOneMinuteRate()), timestamp)
      .addMetricWithSuffix(name, 'm5', this.convertRate(meter.getFiveMinuteRate()), timestamp)
      .addMetricWithSuffix(name, 'm15', this.convertRate(meter.getFifteenMinuteRate()), timestamp);

    // instant count
    this.addInstantCountMetric(meter.getInstantCount(), name, meter.getInstantCountInterval(), timestamp);
  }
}
