import {EndPoint} from '../EndPoint';
import {MetricsServerManager} from '../../MetricsServerManager';
import {MetricFilter, MetricName, IMetricsRegistry}  from '../../common/index';
import {MetricObject} from '../../collect/MetricObject';
import {MetricsManager} from '../../common/MetricsManager';
import {NormalMetricsCollector} from '../../collect/NormalMetricsCollector';
import {MetricsInjectionBridge} from '../../util/MetricsInjectionBridge';
import {Metric} from '../../common/Metric';
const debug = require('debug')('pandora:metrics:MetricEndPoint');

export class AppNameFilter implements MetricFilter {

  appName;

  constructor(appName) {
    this.appName = appName;
  }

  matches(name: MetricName, metric: Metric): boolean {
    let tags = name.getTags() || {};
    if(!tags['appName']) {
      return true;
    } else {
      return tags['appName'] === this.appName;
    }
  }
}

export class MetricsEndPoint extends EndPoint {

  group: string = 'metrics';
  manager: MetricsManager = MetricsInjectionBridge.getMetricsManager();
  rateFactor = 1;
  durationFactor = 1.0;

  async listMetrics(appName?: string): Promise<{}> {
    let filter;
    if(appName) {
      filter = new AppNameFilter(appName);
    }
    if (this.manager.isEnabled()) {
      let resultMap = {};
      for (let groupName of this.manager.listMetricGroups()) {
        let registry = this.manager.getMetricRegistryByGroup(groupName);
        let results: Array<MetricObject> = await this.buildMetricRegistry(registry, filter);
        resultMap[groupName] = results.map((o) => {
          let result = o.toJSON();
          // list 接口过滤掉 value 和 timestamp
          delete result['value'];
          delete result['timestamp'];
          return result;
        });
      }

      return resultMap;
    }
  }

  protected async buildMetricRegistry(registry: IMetricsRegistry, filter: MetricFilter = MetricFilter.ALL) {
    let collectorCls = this.getCollector();
    let collector = new collectorCls({}, this.rateFactor, this.durationFactor, filter);

    const timestamp = Date.now();

    for (let [key, gauge] of registry.getGauges().entries()) {
      debug(`collect gauge key = ${key}`);
      await collector.collectGauge(MetricName.parseKey(key), gauge, timestamp);
    }

    for (let [key, counter] of registry.getCounters().entries()) {
      debug(`collect counter key = ${key}`);
      collector.collectCounter(MetricName.parseKey(key), counter, timestamp);
    }

    for (let [key, histogram] of registry.getHistograms().entries()) {
      debug(`collect histogram key = ${key}`);
      collector.collectHistogram(MetricName.parseKey(key), histogram, timestamp);
    }

    for (let [key, meter] of registry.getMeters().entries()) {
      debug(`collect meter key = ${key}`);
      collector.collectMeter(MetricName.parseKey(key), meter, timestamp);
    }

    for (let [key, timer] of registry.getTimers().entries()) {
      debug(`collect timer key = ${key}`);
      collector.collectTimer(MetricName.parseKey(key), timer, timestamp);
    }

    return collector.build();
  }

  async getMetricsByGroup(groupName: string, appName?: string): Promise<Array<any>> {
    let filter;
    if(appName) {
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
    return this.config['collector'] || NormalMetricsCollector;
  }

}
