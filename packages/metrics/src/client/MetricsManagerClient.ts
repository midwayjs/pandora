import {MetricName, MetricType} from '../common/index';
import {Counter, Histogram, Meter, Timer} from './MetricsProxy';
import {MetricsProcessChannel} from './MetricsProcessChannel';
import {Proxiable} from './domain';

/**
 * @deprecated
 */
export class MetricsManagerClient {

  static metricsProcessChannel = MetricsProcessChannel.getInstance();

  static register(group, name: MetricName | string, metric: Proxiable) {
    if(!metric.type) {
      metric.type = MetricType.GAUGE;
    }

    this.metricsProcessChannel.register(group, name, metric);
  }

  static getCounter(group: string, name: MetricName | string) {
    const counter = new Counter();
    this.register(group, name, counter);
    return counter;
  }

  static getTimer(group: string, name: MetricName | string) {
    const timer = new Timer();
    this.register(group, name, timer);
    return timer;
  }

  static getMeter(group: string, name: MetricName | string) {
    const meter = new Meter();
    this.register(group, name, meter);
    return meter;
  }

  static getHistogram(group: string, name: MetricName | string) {
    const histogram = new Histogram();
    this.register(group, name, histogram);
    return histogram;
  }

}
