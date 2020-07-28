import * as assert from 'assert';
import { TestMeterProvider } from 'test-util';
import { V8GaugeSet } from '../../src/node/V8GaugeSet';
//
// const keys = [
//   "new_space.space_size",
//   "new_space.space_used_size",
//   "new_space.space_available_size",
//   "new_space.physical_space_size",
//   "old_space.space_size",
//   "old_space.space_used_size",
//   "old_space.space_available_size",
//   "old_space.physical_space_size",
//   "code_space.space_size",
//   "code_space.space_used_size",
//   "code_space.space_available_size",
//   "code_space.physical_space_size",
//   "map_space.space_size",
//   "map_space.space_used_size",
//   "map_space.space_available_size",
//   "map_space.physical_space_size",
//   "large_object_space.space_size",
//   "large_object_space.space_used_size",
//   "large_object_space.space_available_size",
//   "large_object_space.physical_space_size",
//   "total_heap_size",
//   "total_heap_size_executable",
//   "total_physical_size",
//   "total_available_size",
//   "used_heap_size",
//   "heap_size_limit",
//   "malloced_memory",
//   "peak_malloced_memory",
//   "does_zap_garbage",
// ];

describe('V8GaugeSet', () => {
  it.skip('should get v8 metrics', async () => {
    const meterProvider = new TestMeterProvider();
    const gaugeSet = new V8GaugeSet(meterProvider.getMeter('test'));
    gaugeSet.subscribe();
    // TODO: pulling

    assert(
      meterProvider
        .getMetricRecord('heap_statistics_heap_size_limit')
        .aggregator.toPoint().value > 0
    );
  });
});
