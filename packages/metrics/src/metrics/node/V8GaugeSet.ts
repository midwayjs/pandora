import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
const debug = require('debug')('metrics:v8');
const v8 = require('v8');

export class V8GaugeSet extends CachedMetricSet {

  heapSpaceStats;
  heapStats;

  constructor() {
    super();
    this.refreshIfNecessary();
  }

  getMetrics() {

    const self = this;
    const gauges = [];

    debug(self.heapSpaceStats);
    debug(self.heapStats);

    for (const stats of self.heapSpaceStats) {
      const spaceName = stats['space_name'];
      if(spaceName) {
        for (const key in stats) {
          if(key !== 'space_name') {
            gauges.push({
              name: MetricName.build(`${spaceName}.${key}`),
              metric: <Gauge<number>> {
                getValue() {
                  self.refreshIfNecessary();
                  return stats[key];
                }
              }
            });
          }
        }
      } else {
        // if don't have space_name just ignore now....
      }

    }

    for (const key in self.heapStats) {
      gauges.push({
        name: MetricName.build(key),
        metric: <Gauge<number>> {
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
    this.heapSpaceStats = v8.getHeapSpaceStatistics();
    this.heapStats = v8.getHeapStatistics();
  }
}
