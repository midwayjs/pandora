import { getHeapSpaceStatistics, getHeapStatistics } from 'v8';
import { MeterProvider } from '@opentelemetry/api';
import { ObserverMetric } from '@opentelemetry/metrics';

export class V8GaugeSet {
  lastRefresh;
  heapSpaceStats = {};
  heapStats = {};

  constructor(private meterProvider: MeterProvider, private dataTTL = 5000) {
    this.refreshIfNecessary();
  }

  refreshIfNecessary() {
    if (Date.now() - this.lastRefresh < this.dataTTL) {
      return;
    }
    this.heapSpaceStats = getHeapSpaceStatistics().reduce((accu, it) => {
      accu[it.space_name + '_space_size'] = it.space_size;
      accu[it.space_name + '_space_used_size'] = it.space_used_size;
      accu[it.space_name + '_space_available_size'] = it.space_available_size;
      accu[it.space_name + '_physical_space_size'] = it.physical_space_size;
      return accu;
    }, {});
    this.heapStats = getHeapStatistics();
    this.lastRefresh = Date.now();
  }

  getMetrics() {
    Object.keys(this.heapSpaceStats).forEach(key => {
      // TODO: observer type not correct, see https://github.com/open-telemetry/opentelemetry-js/pull/1001
      const observer = (this.meterProvider
        .getMeter('v8')
        .createObserver(`heap_space_statistics_${key}`, {
          labelKeys: ['pid'],
        }) as any) as ObserverMetric;
      observer.setCallback(observer => [
        observer.observe(
          () => {
            this.refreshIfNecessary();
            return this.heapSpaceStats[key];
          },
          { pid: String(process.pid) }
        ),
      ]);
    });
    Object.keys(this.heapStats).forEach(key => {
      const observer = (this.meterProvider
        .getMeter('v8')
        .createObserver(`heap_statistics_${key}`, {
          labelKeys: ['pid'],
        }) as any) as ObserverMetric;
      observer.setCallback(observer => [
        observer.observe(
          () => {
            this.refreshIfNecessary();
            return this.heapStats[key];
          },
          { pid: String(process.pid) }
        ),
      ]);
    });
  }
}
