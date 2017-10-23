import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
import * as df from 'node-df';

export class DiskStatGaugeSet extends CachedMetricSet {

  DiskUsage = null;

  constructor() {
    super();
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    for (let i = 0; i < self.DiskUsage.length; i++) {
      const partition = self.DiskUsage[i];

      const path = partition.mount;

      gauges.push({
        name: MetricName.build('disk.partition.total').tagged('partition', path),
        metric: <Gauge<any>> {
          async getValue() {
            await self.refreshIfNecessary();
            return partition.size;
          }
        }
      });
      gauges.push({
        name: MetricName.build('disk.partition.free').tagged('partition', path),
        metric: <Gauge<any>> {
          async getValue() {
            await self.refreshIfNecessary();
            return partition.available;
          }
        }
      });
      gauges.push({
        name: MetricName.build('disk.partition.used_ratio').tagged('partition', path),
        metric: <Gauge<any>> {
          async getValue() {
            await self.refreshIfNecessary();
            return partition.capacity;
          }
        }
      });
    }

    return gauges;
  }

  async getValueInternal() {
    this.DiskUsage = await new Promise((resolve, reject) => {
      df(function (error, response) {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  }

  async refreshIfNecessary(): Promise<void> {
    const current = Date.now();
    if (!this.lastCollectTime || current - this.lastCollectTime > this.dataTTL) {
      await this.getValueInternal();
      // update the last collect time stamp
      this.lastCollectTime = current;
    }
  }
}

