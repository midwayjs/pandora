import {Metric, MetricType, BaseGauge as AbstractGauge} from '../common/index';
import {Proxiable} from './domain';

export class Counter implements Metric, Proxiable {
  type = MetricType.COUNTER;
  proxyMethod = ['inc', 'desc'];

  inc(n) {
  }

  dec(n) {
  }
}

export abstract class Gauge<T> implements AbstractGauge<T>, Proxiable {
  type = MetricType.GAUGE;
  proxyMethod = [];
  abstract getValue(): T;
}

export class Timer implements Metric, Proxiable {
  type = MetricType.TIMER;
  proxyMethod = ['update'];

  update(duration: number, unit) {

  }
}

export class Histogram implements Metric, Proxiable {
  type = MetricType.HISTOGRAM;
  proxyMethod = ['update'];

  update(value: number) {

  }
}

export class Meter implements Metric, Proxiable {
  type = MetricType.METER;
  proxyMethod = ['mark'];

  mark(n?: number) {

  }
}


export class FastCompass implements Metric, Proxiable {
  type = MetricType.FASTCOMPASS;
  proxyMethod = ['record'];

  record(duration, subCategory) {

  }
}
