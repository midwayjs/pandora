import { MetricsCollector } from './MetricsCollector';
import { BucketCounter, ICounter, IFastCompass, IHistogram, IMeter, ITimer, MetricName, Snapshot } from '../common';
import { MetricObject } from './MetricObject';

const BigNumber = require('long');

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

  collectGauge(name: MetricName, value: number, timestamp: number) {
    this.addMetric(name, value, timestamp, MetricObject.MetricType.GAUGE, -1);
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

  collectFastCompass(name: MetricName, fastCompass: IFastCompass, timestamp: number) {
    let bucketInterval = fastCompass.getBucketInterval();

    let start = this.getNormalizedStartTime(timestamp, bucketInterval);
    let totalCount = new BigNumber();
    let totalRt = new BigNumber();
    let successCount = new BigNumber();
    let hitCount = new BigNumber(-1, -1);

    let countPerCategory = fastCompass.getMethodCountPerCategory(start);
    for (let [ key, value ] of countPerCategory.entries()) {
      if (value.has(start)) {
        this.addMetricWithSuffix(name, key + '_bucket_count', value.get(start).toString(), start,
          MetricObject.MetricType.DELTA, bucketInterval);

        totalCount = totalCount.add(value.get(start));
        if ('success' === key) {
          successCount = successCount.add(value.get(start));
        }
        if ('hit' === key) {
          hitCount = value.get(start);
          successCount = successCount.add(value.get(start));
        }
      } else {
        this.addMetricWithSuffix(name, key + '_bucket_count', 0, start,
          MetricObject.MetricType.DELTA, bucketInterval);
      }
    }

    for (let value of fastCompass.getMethodRtPerCategory(start).values()) {
      if (value.has(start)) {
        totalRt = totalRt.add(value.get(start));
      }
    }
    this.addMetricWithSuffix(name, 'bucket_count', totalCount.toString(), start,
      MetricObject.MetricType.DELTA, bucketInterval);
    this.addMetricWithSuffix(name, 'bucket_sum', totalRt.toString(), start,
      MetricObject.MetricType.DELTA, bucketInterval);
    this.addMetricWithSuffix(name, 'qps', this.rate(totalCount, bucketInterval), start,
      MetricObject.MetricType.GAUGE, bucketInterval);
    this.addMetricWithSuffix(name, 'rt', this.rate(totalRt, totalCount), start,
      MetricObject.MetricType.GAUGE, bucketInterval);
    this.addMetricWithSuffix(name, 'success_rate', this.ratio(successCount, totalCount), start,
      MetricObject.MetricType.GAUGE, bucketInterval);
    if (hitCount.gte(0)) {
      this.addMetricWithSuffix(name, 'hit_rate', this.ratio(hitCount, successCount), start,
        MetricObject.MetricType.GAUGE, bucketInterval);
    }
  }
}
