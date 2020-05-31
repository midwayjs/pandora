import * as df from 'node-df';
import { MetricObservableSet } from '../MetricObservableSet';
const util = require('util');
const DiskFree = util.promisify(df);

export class DiskStatGaugeSet extends MetricObservableSet {
  diskUsage: {
    size?: number;
    used?: number;
    available?: number;
    capacity?: number;
    mount?: string;
  } = {};

  onSubscribe() {
    // TODO: Labels
    this.createObservable(
      'disk_partition_total',
      () => this.diskUsage.size,
      {}
    );
    this.createObservable(
      'disk_partition_free',
      () => this.diskUsage.available,
      {}
    );
    this.createObservable(
      'disk_partition_used_ratio',
      () => this.diskUsage.capacity,
      {}
    );
  }

  async getValue() {
    const diskFreeData = await DiskFree({
      file: '/',
      precision: 2,
    });

    if (diskFreeData && diskFreeData.length) {
      this.diskUsage = diskFreeData[0];
    }
  }
}
