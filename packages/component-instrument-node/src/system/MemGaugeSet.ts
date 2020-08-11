import * as si from 'systeminformation';
import { SystemMetric } from '@pandorajs/semantic-conventions';
import { MetricObservableSet } from '../MetricObservableSet';

const metricMap: {
  [key in keyof typeof SystemMetric]?: keyof si.Systeminformation.MemData;
} = {
  [SystemMetric.MEM_TOTAL_BYTES]: 'total',
  [SystemMetric.MEM_USED_BYTES]: 'used',
  [SystemMetric.MEM_FREE_BYTES]: 'free',
  [SystemMetric.MEM_CACHED_BYTES]: 'cached',
  [SystemMetric.MEM_BUFFERS_BYTES]: 'buffers',
  [SystemMetric.MEM_SWAP_TOTAL_BYTES]: 'swaptotal',
  [SystemMetric.MEM_SWAP_USED_BYTES]: 'swapused',
  [SystemMetric.MEM_SWAP_FREE_BYTES]: 'swapfree',
};

type ValueType = si.Systeminformation.MemData;
export class MemGaugeSet extends MetricObservableSet<ValueType> {
  onSubscribe() {
    for (const [metric, key] of Object.entries(metricMap)) {
      this.createValueObserver(metric, value => {
        return [[value[key], {}]];
      });
    }
  }

  async getValue() {
    return si.mem();
  }
}
