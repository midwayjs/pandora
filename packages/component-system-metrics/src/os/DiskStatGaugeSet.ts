import {MetricName, BaseGauge} from 'metrics-common';
import * as df from 'node-df';
import {CachedMetricSet} from '@pandorajs/metrics-util';
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
      name: MetricName.build('disk.partition.total').tagged('partition', '/'),
      metric: <BaseGauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.size;
        }
      }
    });
    gauges.push({
      name: MetricName.build('disk.partition.free').tagged('partition', '/'),
      metric: <BaseGauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.diskUsage.available;
        }
      }
    });
    gauges.push({
      name: MetricName.build('disk.partition.used_ratio').tagged('partition', '/'),
      metric: <BaseGauge<any>> {
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

