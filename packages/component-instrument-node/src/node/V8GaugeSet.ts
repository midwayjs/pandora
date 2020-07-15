import { getHeapSpaceStatistics, getHeapStatistics } from 'v8';
import { MetricObservableSet } from '../MetricObservableSet';

export class V8GaugeSet extends MetricObservableSet {
  heapSpaceStats = {};
  heapStats = {};

  getValue() {
    this.heapSpaceStats = getHeapSpaceStatistics().reduce((accu, it) => {
      accu[it.space_name + '_space_size'] = it.space_size;
      accu[it.space_name + '_space_used_size'] = it.space_used_size;
      accu[it.space_name + '_space_available_size'] = it.space_available_size;
      accu[it.space_name + '_physical_space_size'] = it.physical_space_size;
      return accu;
    }, {});
    this.heapStats = getHeapStatistics();
  }

  onSubscribe() {
    this.getValue();
    Object.keys(this.heapSpaceStats).forEach(key => {
      this.createObservable(
        `heap_space_statistics_${key}`,
        () => {
          return this.heapSpaceStats[key];
        },
        { pid: String(process.pid) }
      );
    });
    Object.keys(this.heapStats).forEach(key => {
      this.createObservable(
        `heap_statistics_${key}`,
        () => {
          return this.heapStats[key];
        },
        { pid: String(process.pid) }
      );
    });
  }
}
