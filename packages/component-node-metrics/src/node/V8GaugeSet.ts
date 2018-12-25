import {MetricName, BaseGauge} from 'metrics-common';
import {CachedMetricSet} from 'pandora-metrics-util';
const debug = require('debug')('metrics:v8');
const v8 = require('v8');

export class V8GaugeSet extends CachedMetricSet {

  heapSpaceStats = {};
  heapStats = {};

  constructor(dataTTL = 5) {
    super(dataTTL);
    this.refreshIfNecessary();
  }

  getMetrics() {

    const self = this;
    const gauges = [];

    debug(self.heapSpaceStats);
    debug(self.heapStats);
    // exec first
    self.refreshIfNecessary();

    for (const key of Object.keys(self.heapSpaceStats)) {
      gauges.push({
        name: MetricName.build(`${key}`),
        metric: <BaseGauge<number>> {
          getValue() {
            self.refreshIfNecessary();
            return self.heapSpaceStats[key];
          }
        }
      });
    }

    for (const key of Object.keys(self.heapStats)) {
      gauges.push({
        name: MetricName.build(key),
        metric: <BaseGauge<number>> {
          getValue() {
            self.refreshIfNecessary();
            return self.heapStats[key];
          }
        }
      });
    }

    return gauges;
  }

  getValueInternal() {
    let heapSpaceStats = v8.getHeapSpaceStatistics();
    let heapStats = v8.getHeapStatistics();

    for (const stats of heapSpaceStats) {
      const spaceName = stats['space_name'];
      if (spaceName) {
        for (const key in stats) {
          if (key !== 'space_name') {
            this.heapSpaceStats[`${spaceName}.${key}`] = stats[key];
          }
        }
      }
    }

    for (const key in heapStats) {
      this.heapStats[key] = heapStats[key];
    }
  }
}
