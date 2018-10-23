import { MetricName } from './MetricName';
import { MetricSet } from './MetricSet';
import { BaseGauge } from './metrics/Gauge';
import { ICounter } from './metrics/Counter';
import { IHistogram } from './metrics/Histogram';
import { IMeter } from './metrics/Meter';
import { ITimer } from './metrics/Timer';
import { MetricBuilder } from './MetricBuilder';
import { MetricFilter } from './MetricFilter';
import { MetricType } from './MetricType';
import { ReservoirType } from './Reservoir';
import { Metric } from './domain';
import { IFastCompass } from './metrics/FastCompass';

const debug = require('debug')('pandora:metrics-common:registry');

export interface IMetricsRegistry {
  register(name: MetricName, metric: Metric): Metric;

  registerAll(prefix, metrics?: MetricSet);

  getKeys();

  counter(name: MetricName): ICounter;

  histogram(name: MetricName): IHistogram;

  meter(name: MetricName): IMeter;

  timer(name: MetricName): ITimer;

  fastCompass(name: MetricName): IFastCompass;

  getMetric(name: MetricName): Metric;

  getMetrics(metricType?: string, filter?: MetricFilter);

  getGauges(filter?: MetricFilter): Map<string, BaseGauge<any>>;

  getCounters(filter?: MetricFilter): Map<string, ICounter>;

  getHistograms(filter?: MetricFilter): Map<string, IHistogram>;

  getMeters(filter?: MetricFilter): Map<string, IMeter>;

  getTimers(filter?: MetricFilter): Map<string, ITimer>;

  getFastCompasses(filter?: MetricFilter): Map<string, IFastCompass>;

  getMetricNames();

  remove(metricsKey: string);
}

export class MetricsRegistry implements IMetricsRegistry {

  clientId: string = Math.random().toString(35).substr(2, 10);

  metricsSet = new Map<string, {
    name: MetricName,
    metric: Metric
  }>();

  register(name: MetricName, metric: Metric): Metric {
    if (metric instanceof MetricSet) {
      debug('------------> metrics is set:', name, metric);
      this.registerAll(name, <MetricSet> metric);
    } else {
      debug('------------> metrics is normal:', name.getNameKey());
      if (!metric.type) {
        metric.type = MetricType.GAUGE;
      }

      this.metricsSet.set(name.getNameKey(), {
        name,
        metric
      });
    }
    return metric;
  }

  registerAll(prefix = MetricName.EMPTY, metrics?: MetricSet) {
    if (!metrics) {
      metrics = <any>prefix;
      prefix = MetricName.EMPTY;
    }
    for (let { name, metric } of metrics.getMetrics()) {
      if (typeof name === 'string') {
        name = MetricName.parseKey(name);
      }

      if (metric instanceof MetricSet) {
        this.registerAll(MetricName.join(prefix, name), metric);
      } else {
        this.register(MetricName.join(prefix, name), metric);
      }
    }
  }

  getKeys() {
    return Array.from(this.metricsSet.keys());
  }

  counter(name: MetricName): ICounter {
    return <ICounter>this.getOrAdd(name, MetricBuilder.COUNTERS);
  }

  histogram(name: MetricName): IHistogram {
    return <IHistogram>this.getOrAdd(name, MetricBuilder.HISTOGRAMS);
  }

  meter(name: MetricName): IMeter {
    return <IMeter>this.getOrAdd(name, MetricBuilder.METERS);
  }

  timer(name: MetricName): ITimer {
    return <ITimer>this.getOrAdd(name, MetricBuilder.TIMERS);
  }

  fastCompass(name: MetricName): IFastCompass {
    return <IFastCompass>this.getOrAdd(name, MetricBuilder.FASTCOMPASSES);
  }

  protected getOrAdd(name: MetricName, builder, type?: ReservoirType) {
    if (this.metricsSet.has(name.getNameKey())) {
      return this.metricsSet.get(name.getNameKey()).metric;
    } else {
      // add
      return this.register(name, builder.newMetric(name, type));
    }
  }

  getMetric(name: MetricName): Metric {
    const key = name.getNameKey();
    debug(`find metric in registry name = ${key}, metrics num = ${this.metricsSet.size}`);

    if (this.metricsSet.has(key)) {
      return this.metricsSet.get(key).metric;
    } else {
      return null;
    }
  }

  getMetrics(metricType?: string, filter?: MetricFilter) {
    const filterMap: Map<string, Metric> = new Map();
    if (!filter) {
      filter = MetricFilter.ALL;
    }

    if (metricType) {
      for (let [ key, value ] of this.metricsSet.entries()) {
        debug(key + ' => ' + value.metric.type, metricType);
        if (value.metric.type === metricType && filter.matches(value.name, value.metric)) {
          filterMap.set(key, value.metric);
        }
      }
    } else {
      for (let [ key, value ] of this.metricsSet.entries()) {
        filterMap.set(key, value.metric);
      }
    }

    return filterMap;
  }

  getGauges(filter?: MetricFilter): Map<string, BaseGauge<any>> {
    return <Map<string, BaseGauge<any>>> this.getMetrics(MetricType.GAUGE, filter);
  }

  getCounters(filter?: MetricFilter): Map<string, ICounter> {
    return <Map<string, ICounter>> this.getMetrics(MetricType.COUNTER, filter);
  }

  getHistograms(filter?: MetricFilter): Map<string, IHistogram> {
    return <Map<string, IHistogram>> this.getMetrics(MetricType.HISTOGRAM, filter);
  }

  getMeters(filter?: MetricFilter): Map<string, IMeter> {
    return <Map<string, IMeter>> this.getMetrics(MetricType.METER, filter);
  }

  getTimers(filter?: MetricFilter): Map<string, ITimer> {
    return <Map<string, ITimer>> this.getMetrics(MetricType.TIMER, filter);
  }

  getFastCompasses(filter?: MetricFilter): Map<string, IFastCompass> {
    return <Map<string, IFastCompass>> this.getMetrics(MetricType.FASTCOMPASS, filter);
  }

  getMetricNames() {
    let names = [];
    for (let metricObject of this.metricsSet.values()) {
      names.push(metricObject.name);
    }
    return names;
  }

  remove(metricsKey: string) {
    this.metricsSet.delete(metricsKey);
  }
}
