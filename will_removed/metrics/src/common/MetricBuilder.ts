import {MetricName} from './MetricName';
import {MetricsCollectPeriodConfig} from './MetricsCollectPeriodConfig';
import {BaseHistogram} from './metrics/Histogram';
import {BaseCounter} from './metrics/Counter';
import {BaseMeter} from './metrics/Meter';
import {BaseTimer} from './metrics/Timer';
import {BucketCounter} from './metrics/BucketCounter';
import {ReservoirType} from './Reservoir';
import {Metric} from './domain';
import { BaseFastCompass } from './metrics/FastCompass';

export class MetricBuilder {

  static config = MetricsCollectPeriodConfig.getInstance();

  static COUNTERS = {

    newMetric(name: MetricName) {
      return new BucketCounter(MetricBuilder.config.period(name.getMetricLevel()));
    },
    isInstance(metric: Metric) {
      return metric instanceof BaseCounter;
    }
  };

  static HISTOGRAMS = {

    newMetric(name: MetricName, type: ReservoirType = ReservoirType.EXPONENTIALLY_DECAYING) {
      return new BaseHistogram(type, MetricBuilder.config.period(name.getMetricLevel()));
    },
    isInstance(metric: Metric) {
      return metric instanceof BaseHistogram;
    }
  };

  static METERS = {

    newMetric(name: MetricName) {
      return new BaseMeter(MetricBuilder.config.period(name.getMetricLevel()));
    },
    isInstance(metric: Metric) {
      return metric instanceof BaseMeter;
    }
  };

  static TIMERS = {

    newMetric(name: MetricName) {
      return new BaseTimer(MetricBuilder.config.period(name.getMetricLevel()));
    },
    isInstance(metric: Metric) {
      return metric instanceof BaseTimer;
    }
  };

  static FASTCOMPASSES = {
    newMetric(name: MetricName) {
      return new BaseFastCompass(MetricBuilder.config.period(name.getMetricLevel()));
    },
    isInstance(metric: Metric) {
      return metric instanceof BaseFastCompass;
    }
  };

}
