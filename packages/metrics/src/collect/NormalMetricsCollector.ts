import {MetricsCollector} from './MetricsCollector';
import {BaseGauge, MetricName, ITimer, IHistogram, ICounter, IMeter} from '../common/index';
import {MetricObject} from './MetricObject';

export class NormalMetricsCollector extends MetricsCollector {

  collectTimer(name: MetricName, timer: ITimer, timestamp: number) {

  }

  collectHistogram(name: MetricName, histogram: IHistogram, timestamp: number) {
    // let snapshot: Snapshot = histogram.getSnapshot();
    // this.addMetricWithSuffix(name, 'mean', snapshot.getMean(), timestamp);
  }

  collectGauge(name: MetricName, gauge: BaseGauge<any>, timestamp: number) {
    this.addMetric(name, gauge.getValue(), timestamp, MetricObject.MetricType.GAUGE, -1);
  }

  collectCounter(name: MetricName, counter: ICounter, timestamp: number) {
    let normalizedName: MetricName = name.getKey().endsWith('count') ? name : name.resolve('count');
    this.addMetric(normalizedName, counter.getCount(), timestamp, MetricObject.MetricType.COUNTER, -1);

//   if (counter instanceof BucketCounter) {
//   int countInterval = (<BucketCounter> counter).getBucketInterval();
//   // bucket count
//   addInstantCountMetric(((BucketCounter) counter).getBucketCounts(), name, countInterval);
// }
  }

  collectMeter(name: MetricName, meter: IMeter, timestamp: number) {
    this.addMetricWithSuffix(name, 'count', meter.getCount(), timestamp, MetricObject.MetricType.COUNTER)
    // convert rate
      .addMetricWithSuffix(name, 'm1', this.convertRate(meter.getOneMinuteRate()), timestamp);
  }
}
