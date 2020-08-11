import * as si from 'systeminformation';
import { SystemMetric, SystemAttribute } from '@pandorajs/semantic-conventions';
import { MetricObservableSet } from '../MetricObservableSet';

type ValueType = si.Systeminformation.FsSizeData[];
export class DiskStatGaugeSet extends MetricObservableSet<ValueType> {
  onSubscribe() {
    this.createValueObserver(SystemMetric.DISK_FREE_BYTES, value => {
      return value.map(it => {
        return [
          it.size - it.used,
          {
            [SystemAttribute.DISK_FS_NAME]: it.fs,
            [SystemAttribute.DISK_MOUNT_POINT]: it.mount,
          },
        ];
      });
    });
    this.createValueObserver(SystemMetric.DISK_TOTAL_BYTES, value => {
      return value.map(it => {
        return [
          it.size,
          {
            [SystemAttribute.DISK_FS_NAME]: it.fs,
            [SystemAttribute.DISK_MOUNT_POINT]: it.mount,
          },
        ];
      });
    });
  }

  async getValue() {
    return si.fsSize();
  }
}
