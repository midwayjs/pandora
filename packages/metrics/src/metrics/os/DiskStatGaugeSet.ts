import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
import * as df from 'node-df';
const util = require('util');
const DiskFree = util.promisify(df);

export class DiskStatGaugeSet extends CachedMetricSet {

  diskUsage: {
    size?: number,
    available?: number,
    capacity?: number;
  } = {};

  getMetrics() {
    let self = this;
    let gauges = [];

    gauges.push({
      name: MetricName.build('disk.partition.total').tagged('partition', '/'),
      metric: <Gauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.size;
        }
      }
    });
    gauges.push({
      name: MetricName.build('disk.partition.free').tagged('partition', '/'),
      metric: <Gauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.available;
        }
      }
    });
    gauges.push({
      name: MetricName.build('disk.partition.used_ratio').tagged('partition', '/'),
      metric: <Gauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.capacity;
        }
      }
    });

    return gauges;
  }

  async getValueInternal() {
    const diskFreeData = await DiskFree();
    if(diskFreeData) {
      for (let i = 0; i < diskFreeData.length; i++) {
        const partition = diskFreeData[i];
        if(partition.mount === '/') {
          this.diskUsage = partition;
        }
      }
    }
  }
}

