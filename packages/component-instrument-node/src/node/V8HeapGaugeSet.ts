import { getHeapStatistics, HeapInfo } from 'v8';
import { V8Metric } from '@pandorajs/semantic-conventions';
import { MetricObservableSet } from '../MetricObservableSet';

const map: {
  [key in keyof typeof V8Metric]?: keyof HeapInfo;
} = {
  [V8Metric.HEAP_STAT_TOTAL_SIZE]: 'total_heap_size',
  [V8Metric.HEAP_STAT_TOTAL_SIZE_EXECUTABLE]: 'total_heap_size_executable',
  [V8Metric.HEAP_STAT_TOTAL_PHYSICAL_SIZE]: 'total_physical_size',
  [V8Metric.HEAP_STAT_TOTAL_AVAILABLE_SIZE]: 'total_available_size',
  [V8Metric.HEAP_STAT_USED_HEAP_SIZE]: 'used_heap_size',
  [V8Metric.HEAP_STAT_HEAP_SIZE_LIMIT]: 'heap_size_limit',
  [V8Metric.HEAP_STAT_MALLOCED_MEMORY]: 'malloced_memory',
  [V8Metric.HEAP_STAT_PEAK_MALLOCED_MEMORY]: 'peak_malloced_memory',
  [V8Metric.HEAP_STAT_DOES_ZAP_GARBAGE]: 'does_zap_garbage',
  [V8Metric.HEAP_STAT_NUMBER_OF_NATIVE_CONTEXTS]: 'number_of_native_contexts',
  [V8Metric.HEAP_STAT_NUMBER_OF_DETACHED_CONTEXTS]:
    'number_of_detached_contexts',
};

export class V8HeapGaugeSet extends MetricObservableSet<HeapInfo> {
  getValue() {
    return getHeapStatistics();
  }

  onSubscribe() {
    for (const [metric, key] of Object.entries(map)) {
      this.createValueObserver(metric, value => {
        return [[value[key], {}]];
      });
    }
  }
}
