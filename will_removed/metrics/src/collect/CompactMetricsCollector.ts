import { MetricsCollector } from './MetricsCollector';
import { BucketCounter, ICounter, IHistogram, IMeter, ITimer, MetricName, Snapshot } from '../common';
import { MetricObject } from './MetricObject';

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

}
