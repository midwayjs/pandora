import { getHeapSpaceStatistics, HeapSpaceInfo } from 'v8';
import { V8Metric, V8Attribute } from '@pandorajs/semantic-conventions';
import { MetricObservableSet } from '../MetricObservableSet';

const map: {
  [key in keyof typeof V8Metric]?: keyof HeapSpaceInfo;
} = {
  [V8Metric.HEAP_SPACE_SIZE]: 'space_size',
  [V8Metric.HEAP_SPACE_USED_SIZE]: 'space_used_size',
  [V8Metric.HEAP_SPACE_AVAILABLE_SIZE]: 'space_available_size',
  [V8Metric.HEAP_SPACE_PHYSICAL_SPACE_SIZE]: 'physical_space_size',
};

export class V8HeapSpaceGaugeSet extends MetricObservableSet<HeapSpaceInfo[]> {
  getValue() {
    return getHeapSpaceStatistics();
  }

  onSubscribe() {
    for (const [metric, key] of Object.entries(map)) {
      this.createValueObserver(metric, value => {
        return value.map(space => {
          return [
            space[key] as number,
            {
              [V8Attribute.HEAP_SPACE_NAME]: space.space_name,
            },
          ];
        });
      });
    }
  }
}
