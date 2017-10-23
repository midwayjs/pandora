import {MetricsCollector} from './MetricsCollector';
import {BaseGauge, MetricName, Snapshot, BucketCounter} from '../common/index';
import {MetricObject} from './MetricObject';
import {ITimer} from '../common/metrics/Timer';
import {IHistogram} from '../common/metrics/Histogram';
import {ICounter} from '../common/metrics/Counter';
import {IMeter} from '../common/metrics/Meter';

export class CompactMetricsCollector extends MetricsCollector {

  collectTimer(name: MetricName, timer: ITimer, timestamp: number) {

  }

  collectHistogram(name: MetricName, histogram: IHistogram, timestamp: number) {
    let snapshot: Snapshot = histogram.getSnapshot();
    this.addMetricWithSuffix(name, 'mean', snapshot.getMean(), timestamp);
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
      this.addInstantCountMetric((<BucketCounter>counter).getBucketCounts(), name, countInterval);
    }
  }

  collectMeter(name: MetricName, meter: IMeter, timestamp: number) {
    this.addMetricWithSuffix(name, 'count', meter.getCount(), timestamp, MetricObject.MetricType.COUNTER)
    // convert rate
      .addMetricWithSuffix(name, 'm1', this.convertRate(meter.getOneMinuteRate()), timestamp);
  }

  private addInstantCountMetric(bucketCounts: Map<number, number>, name: MetricName, countInterval: any) {

  }
}
