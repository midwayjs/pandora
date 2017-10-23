import {EndPoint} from '../EndPoint';
import {MetricsServerManager} from '../../MetricsServerManager';
import {MetricFilter, MetricName, IMetricsRegistry}  from '../../common/index';
import {CollectLevel, MetricsCollectorFactory} from '../../collect/MetricsCollectorFactory';
import {MetricObject} from '../../collect/MetricObject';
import {MetricsManager} from '../../common/MetricsManager';
const debug = require('debug')('pandora:metrics:MetricEndPoint');

export class MetricsEndPoint extends EndPoint {

  group: string = 'metrics';

  manager: MetricsManager = MetricsServerManager.getInstance();

  rateFactor = 1;
  durationFactor = 1.0;

  listMetrics(): {} {
    if (this.manager.isEnabled()) {
      let resultMap = {};
      for (let groupName of this.manager.listMetricGroups()) {
        let registry = this.manager.getMetricRegistryByGroup(groupName);
        let results: Array<MetricObject> = this.buildMetricRegistry(registry);
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

  protected buildMetricRegistry(registry: IMetricsRegistry, filter: MetricFilter = MetricFilter.ALL) {
    let collector =
      MetricsCollectorFactory.create(CollectLevel.NORMAL, {}, this.rateFactor, this.durationFactor, filter);

    const timestamp = Date.now();

    for (let [key, gauge] of registry.getGauges().entries()) {
      debug(`collect gauge key = ${key}`);
      collector.collectGauge(MetricName.parseKey(key), gauge, timestamp);
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

  getMetricsByGroup(groupName: string): Array<any> {
    let registry = this.manager.getMetricRegistryByGroup(groupName);
    let results: Array<MetricObject> = this.buildMetricRegistry(registry);
    return results.map((o) => {
      return o.toJSON();
    });
  }

  hasMetricsGroup(groupName: string): boolean {
    return (<MetricsServerManager>this.manager).hasMetricRegistryByGroup(groupName);
  }

}
