import { MetricsCollector } from './MetricsCollector';
import { BucketCounter, ICounter, IFastCompass, IHistogram, IMeter, ITimer, MetricName, Snapshot } from '../common';
import { MetricObject } from './MetricObject';

const BigNumber = require('long');
/**
 * 根据采集周期获取采集点，支持多个采集点的输出
 */
export class CompactMetricsCollector extends MetricsCollector {

  collectTimer(name: MetricName, timer: ITimer, timestamp: number) {
    let snapshot = timer.getSnapshot();
    let startTime = timestamp - this.reportInterval * 1000 + 1;

    let totalCounts = timer.getInstantCount(startTime);
    for (let [ time, metricValue ] of totalCounts.entries()) {
      this.addMetricWithSuffix(name, 'bucket_count', metricValue, time, MetricObject.MetricType.DELTA, this.metricsCollectPeriodConfig.period(name.getMetricLevel()));
    }

    this.addMetricWithSuffix(name, 'count', timer.getCount(), timestamp, MetricObject.MetricType.COUNTER)
    // convert rate
      .addMetricWithSuffix(name, 'm1', this.convertRate(timer.getOneMinuteRate()), timestamp)
      // convert duration
      .addMetricWithSuffix(name, 'rt', this.convertDuration(snapshot.getMean()), timestamp)
      .addMetricWithSuffix(name, 'mean', this.convertDuration(snapshot.getMean()), timestamp);

    // instant count
    this.addInstantCountMetric(timer.getInstantCount(), name, timer.getInstantCountInterval(), timestamp);
  }

  collectHistogram(name: MetricName, histogram: IHistogram, timestamp: number) {
    let snapshot: Snapshot = histogram.getSnapshot();
    this.addMetricWithSuffix(name, 'mean', snapshot.getMean(), timestamp);
  }

  collectGauge(name: MetricName, value: number, timestamp: number) {
    this.addMetric(name, value, timestamp, MetricObject.MetricType.GAUGE, -1);
  }

  collectCounter(name: MetricName, counter: ICounter, timestamp: number) {
    let startTime = timestamp - this.reportInterval * 1000 + 1;

    if (counter instanceof BucketCounter) {
      let totalCounts = (<BucketCounter> counter).getBucketCounts(startTime);
      for (let [ time, metricValue ] of totalCounts.entries()) {
        this.addMetricWithSuffix(name, 'bucket_count', metricValue, time, MetricObject.MetricType.DELTA, this.metricsCollectPeriodConfig.period(name.getMetricLevel()));
      }
    }

    // add total count
    let normalizedName = name.getKey().endsWith('count') ? name : name.resolve('count');
    this.addMetric(normalizedName, counter.getCount(), timestamp, MetricObject.MetricType.COUNTER);
  }

  collectMeter(name: MetricName, meter: IMeter, timestamp: number) {
    let startTime = timestamp - this.reportInterval * 1000 + 1;
    let totalCounts = meter.getInstantCount(startTime);

    for (let [ time, metricValue ] of totalCounts.entries()) {
      this.addMetricWithSuffix(name, 'bucket_count', metricValue, time, MetricObject.MetricType.DELTA, this.metricsCollectPeriodConfig.period(name.getMetricLevel()));
    }

    this.addMetricWithSuffix(name, 'count', meter.getCount(), timestamp, MetricObject.MetricType.COUNTER)
    // convert rate
      .addMetricWithSuffix(name, 'm1', this.convertRate(meter.getOneMinuteRate()), timestamp);
  }

  collectFastCompass(name: MetricName, fastCompass: IFastCompass, timestamp: number) {
    let bucketInterval = fastCompass.getBucketInterval();

    let start = this.getNormalizedStartTime(timestamp, bucketInterval);
    let totalCount = new BigNumber();
    let totalRt = new BigNumber();
    let successCount = new BigNumber();
    let hitCount = new BigNumber(-1);

    let countPerCategory = fastCompass.getMethodCountPerCategory(start);
    for (let [ key, value ] of countPerCategory.entries()) {
      if (value.has(start)) {
        this.addMetricWithSuffix(name, key + '_bucket_count', value.get(start).toString(), start,
          MetricObject.MetricType.DELTA, bucketInterval);

        totalCount.add(value.get(start));
        if ('success' === key) {
          successCount.add(value.get(start));
        }
        if ('hit' === key) {
          hitCount = value.get(start);
          successCount.add(value.get(start));
        }
      } else {
        this.addMetricWithSuffix(name, key + '_bucket_count', 0, start,
          MetricObject.MetricType.DELTA, bucketInterval);
      }
    }

    for (let value of fastCompass.getMethodRtPerCategory(start).values()) {
      if (value.has(start)) {
        totalRt.add(value.get(start));
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
