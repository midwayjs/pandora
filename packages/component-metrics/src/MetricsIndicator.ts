import {IIndicator, IndicatorScope} from 'pandora-component-indicator';
import {MetricsManager} from './MetricsManager';
import { IMetricsRegistry, MetricName } from 'metrics-common';
import { MetricObject } from 'pandora-metrics-util';
import {NormalMetricsCollector} from 'pandora-metrics-util';
const debug = require('debug')('pandora:metrics:MetricsIndicator');


export interface MetricsIndicatorInvokeQuery {
  action: 'list' | 'group';
  group?: string;
}

export class MetricsIndicator implements IIndicator {

  group = 'metrics';
  scope = IndicatorScope.PROCESS;
  metricsManager: MetricsManager;

  constructor(metricsManager: MetricsManager) {
    this.metricsManager = metricsManager;
  }

  async invoke(query: MetricsIndicatorInvokeQuery) {

    if(query.action === 'list') {
      return this.listMetrics(query.group);
    }

    if(query.action === 'group') {
      return this.getMetricsByGroup(query.group);
    }

  }

  rateFactor = 1;
  durationFactor = 1.0;

  async listMetrics(group?: string): Promise<{[groupName: string]: MetricObject[]}> {
    let resultMap = {};
    for (let groupName of this.metricsManager.listMetricGroups()) {
      if (!group || (group && groupName === group)) {
        let registry = this.metricsManager.getMetricRegistryByGroup(groupName);
        let results: Array<MetricObject> = await this.buildMetricRegistry(registry);
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

  async buildMetricRegistry(registry: IMetricsRegistry) {
    let collector = new NormalMetricsCollector({
      globalTags: {},
      rateFactor: this.rateFactor,
      durationFactor: this.durationFactor,
      reportInterval: -1
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

  async getMetricsByGroup(groupName: string): Promise<Array<any>> {
    if(!this.hasMetricsGroup(groupName)) {
      throw new Error('The specified group is not found!');
    }
    let registry = this.metricsManager.getMetricRegistryByGroup(groupName);
    let results: Array<MetricObject> = await this.buildMetricRegistry(registry);
    return results.map((o) => {
      return o.toJSON();
    });
  }

  hasMetricsGroup(groupName: string): boolean {
    return this.metricsManager.hasMetricRegistryByGroup(groupName);
  }

}

