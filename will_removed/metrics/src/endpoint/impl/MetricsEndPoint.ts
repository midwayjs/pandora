import { EndPoint } from '../EndPoint';
import { MetricsServerManager } from '../../MetricsServerManager';
import { IMetricsRegistry, Metric, MetricFilter, MetricName, MetricsManager } from '../../common';
import { MetricObject, MetricsInjectionBridge, NormalMetricsCollector } from '../..';

const debug = require('debug')('pandora:metrics:MetricEndPoint');

export class AppNameFilter implements MetricFilter {

  appName;

  constructor(appName) {
    this.appName = appName;
  }

  matches(name: MetricName, metric: Metric): boolean {
    let tags = name.getTags() || {};
    if (!tags[ 'appName' ]) {
      return true;
    } else {
      return tags[ 'appName' ] === this.appName;
    }
  }
}

export class MetricsEndPoint extends EndPoint {

  group: string = 'metrics';
  manager: MetricsManager = MetricsInjectionBridge.getMetricsManager();
  rateFactor = 1;
  durationFactor = 1.0;

  async listMetrics(group?: string, appName?: string): Promise<{}> {
    let filter;
    if (appName) {
      filter = new AppNameFilter(appName);
    }
    if (this.manager.isEnabled()) {
      let resultMap = {};
      for (let groupName of this.manager.listMetricGroups()) {
        if (!group || (group && groupName === group)) {
          let registry = this.manager.getMetricRegistryByGroup(groupName);
          let results: Array<MetricObject> = await this.buildMetricRegistry(registry, filter);
          resultMap[ groupName ] = results.map((o) => {
            let result = o.toJSON();
            // list 接口过滤掉 value 和 timestamp
            delete result[ 'value' ];
            delete result[ 'timestamp' ];
            return result;
          });
        }
      }

      return resultMap;
    }
  }

  protected async buildMetricRegistry(registry: IMetricsRegistry, filter: MetricFilter = MetricFilter.ALL) {
    let collectorCls = this.getCollector();
    let collector = new collectorCls({
      globalTags: {},
      rateFactor: this.rateFactor,
      durationFactor: this.durationFactor,
      reportInterval: -1,
      filter
    });

    const timestamp = Date.now();

    let gauges = Array.from(registry.getGauges().values());
    let results = await Promise.all(gauges.map((gauge) => {
      return gauge.getValue();
    }));

    Array.from(registry.getGauges().keys()).forEach((key, index) => {
      debug(`collect gauge key = ${key}`);
      collector.collectGauge(MetricName.parseKey(key), results[ index ], timestamp);
    });

    for (let [ key, counter ] of registry.getCounters().entries()) {
      debug(`collect counter key = ${key}`);
      collector.collectCounter(MetricName.parseKey(key), counter, timestamp);
    }

    for (let [ key, histogram ] of registry.getHistograms().entries()) {
      debug(`collect histogram key = ${key}`);
      collector.collectHistogram(MetricName.parseKey(key), histogram, timestamp);
    }

    for (let [ key, meter ] of registry.getMeters().entries()) {
      debug(`collect meter key = ${key}`);
      collector.collectMeter(MetricName.parseKey(key), meter, timestamp);
    }

    for (let [ key, timer ] of registry.getTimers().entries()) {
      debug(`collect timer key = ${key}`);
      collector.collectTimer(MetricName.parseKey(key), timer, timestamp);
    }

    for (let [ key, fastcompass ] of registry.getFastCompasses().entries()) {
      debug(`collect fastcompass key = ${key}`);
      collector.collectFastCompass(MetricName.parseKey(key), fastcompass, timestamp);
    }

    return collector.build();
  }

  async getMetricsByGroup(groupName: string, appName?: string): Promise<Array<any>> {
    let filter;
    if (appName) {
      filter = new AppNameFilter(appName);
    }
    let registry = this.manager.getMetricRegistryByGroup(groupName);
    let results: Array<MetricObject> = await this.buildMetricRegistry(registry, filter);
    return results.map((o) => {
      return o.toJSON();
    });
  }

  hasMetricsGroup(groupName: string): boolean {
    return (<MetricsServerManager>this.manager).hasMetricRegistryByGroup(groupName);
  }

  protected getCollector() {
    return this.config[ 'collector' ] || NormalMetricsCollector;
  }

}
