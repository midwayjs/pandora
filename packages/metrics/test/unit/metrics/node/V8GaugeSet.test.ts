import {V8GaugeSet} from '../../../../src/metrics/node/V8GaugeSet';
import {expect} from 'chai';
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

describe('/test/unit/metrics/node/V8GaugeSet', function () {

  it('should get v8 metrics', () => {
    const gaugeSet = new V8GaugeSet();
    const gauges = gaugeSet.getMetrics();
    const data = {};
    for (const gauge of gauges) {
      data[gauge.name.key] = gauge.metric.getValue();
    }
    for (const key of Object.keys(data)) {
      expect(data[key]).to.be.a('number');
    }
  });
});
