import {MetricsManager} from 'pandora-component-metrics';
const debug = require('debug')('pandora:reporter-manager:MetricsOscillatorOption');
import {
  BaseGauge,
  BaseCounter,
  BaseHistogram,
  BaseMeter,
  BaseTimer,
  MetricType, BaseFastCompass,
  MetricName
} from 'metrics-common';
import {EventEmitter} from 'events';
import {CompactMetricsCollector} from 'pandora-component-metrics';

export interface MetricsOscillatorOption {
  interval: number;
}

export class MetricsOscillator extends EventEmitter {

  options;
  interval: number;
  intervalHandler;
  metricsManager: MetricsManager;

  constructor(metricsManager: MetricsManager, options: MetricsOscillatorOption) {
    super();
    this.options = options;
    this.interval = options.interval;
    this.metricsManager = metricsManager;
  }

  start() {
    const {interval} = this;
    if(!this.intervalHandler) {
      this.intervalHandler = setInterval(async () => {
        try {
          debug('exec report once');
          const categoryMetrics = this.metricsManager.getAllCategoryMetrics();
          await this.report(
            {
              gauges: <Map<string, BaseGauge<any>>> categoryMetrics.get(MetricType.GAUGE),
              counters: <Map<string, BaseCounter>> categoryMetrics.get(MetricType.COUNTER),
              histograms: <Map<string, BaseHistogram>> categoryMetrics.get(MetricType.HISTOGRAM),
              meters: <Map<string, BaseMeter>> categoryMetrics.get(MetricType.METER),
              timers: <Map<string, BaseTimer>> categoryMetrics.get(MetricType.TIMER),
              fastCompasses: <Map<string, BaseFastCompass>> categoryMetrics.get(MetricType.FASTCOMPASS)
            }
          );
        } catch (err) {
          console.error(err);
        }
      }, interval * 1000);
    }
  }

  async report(metricsData: {
    gauges: Map<string, BaseGauge<any>>,
    counters: Map<string, BaseCounter>,
    histograms: Map<string, BaseHistogram>,
    meters: Map<string, BaseMeter>,
    timers: Map<string, BaseTimer>,
    fastCompasses: Map<string, BaseFastCompass>
  }) {

    const {gauges, counters, histograms, meters, timers, fastCompasses} = metricsData;
    const timestamp = Date.now();

    const collector = new CompactMetricsCollector({
      reportInterval: this.interval,
    });

    const gaugesArr: BaseGauge<any>[] = Array.from(gauges.values());
    const results: number[] = await Promise.all(gaugesArr.map((gauge) => {
      return gauge.getValue();
    }));

    Array.from(gauges.keys()).forEach((key: string, index) => {
      collector.collectGauge(MetricName.parseKey(key), results[index], timestamp);
    });

    for (const [key, counter] of counters.entries()) {
      collector.collectCounter(MetricName.parseKey(key), counter, timestamp);
    }

    for (const [key, histogram] of histograms.entries()) {
      collector.collectHistogram(MetricName.parseKey(key), histogram, timestamp);
    }

    for (const [key, meter] of meters.entries()) {
      collector.collectMeter(MetricName.parseKey(key), meter, timestamp);
    }

    for (const [key, timer] of timers.entries()) {
      collector.collectTimer(MetricName.parseKey(key), timer, timestamp);
    }

    for (const [key, fastCompass] of fastCompasses.entries()) {
      collector.collectFastCompass(MetricName.parseKey(key), fastCompass, timestamp);
    }
    try {
      const list = [];
      for (const metricObject of collector.build()) {
        if (metricObject && metricObject.toJSON) {
          list.push(metricObject.toJSON());
        }
      }
      if(list.length) {
        this.emit('oscillate', list);
      }
    } catch (err) {
      console.error('report metrics data error!', err);
    }

  }

  stop() {
    this.intervalHandler && clearInterval(this.intervalHandler);
  }

}

