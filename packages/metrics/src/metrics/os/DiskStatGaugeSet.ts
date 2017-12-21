import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
import * as df from 'node-df';
const util = require('util');
const DiskFree = util.promisify(df);

export class DiskStatGaugeSet extends CachedMetricSet {

  diskUsage: {
    size?: number,
    used?: number;
    available?: number,
    capacity?: number;
    mount?: string;
  } = {};

  getMetrics() {
    let self = this;
    let gauges = [];

    gauges.push({
      name: MetricName.build('disk.partition.total').tagged('partition', self.diskUsage.mount),
      metric: <Gauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.size;
        }
      }
    });
    gauges.push({
      name: MetricName.build('disk.partition.free').tagged('partition', self.diskUsage.mount),
      metric: <Gauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.available;
        }
      }
    });
    gauges.push({
      name: MetricName.build('disk.partition.used_ratio').tagged('partition', self.diskUsage.mount),
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
    const diskFreeData = await DiskFree({
      file: '/',
      precision: 2
    });

    if(diskFreeData && diskFreeData.length) {
      this.diskUsage = diskFreeData[0];
    }
  }
}

