import {Reporter} from '../domain';
import {
  BaseGauge,
  BaseCounter,
  BaseHistogram,
  BaseMeter,
  BaseTimer,
  MetricType,
} from '../common/index';
const debug = require('debug')('pandora:metrics:schedule-reporter');

export abstract class ScheduledMetricsReporter implements Reporter {

  options;
  interval;
  intervalHandler;
  metricsManager;

  constructor(actuatorManager?, options: {
    rateFactor?: number,
    durationFactor?: number
  } = {}) {
    this.options = options;
    if(actuatorManager) {
      this.metricsManager = actuatorManager.getMetricsManager();
    }
  }

  // for test
  setMetricsManager(metricsManager) {
    this.metricsManager = metricsManager;
  }

  start(interval) {
    this.interval = interval;
    if(!this.intervalHandler) {
      this.intervalHandler = setInterval(async () => {
        debug('exec report once');
        try {
          const categoryMetrics = this.metricsManager.getAllCategoryMetrics();
          await this.report(
            {
              gauges: categoryMetrics.get(MetricType.GAUGE),
              counters: categoryMetrics.get(MetricType.COUNTER),
              histograms: categoryMetrics.get(MetricType.HISTOGRAM),
              meters: categoryMetrics.get(MetricType.METER),
              timers: categoryMetrics.get(MetricType.TIMER)
            }
          );
        } catch (err) {
          console.error(err);
        }
      }, interval * 1000);
    }
  }

  abstract async report(metricsData: {
    gauges: Map<string, BaseGauge<any>>,
    counters: Map<string, BaseCounter>,
    histograms: Map<string, BaseHistogram>, meters: Map<string, BaseMeter>,
    timers: Map<string, BaseTimer>,
  });

  stop() {
    this.intervalHandler && clearInterval(this.intervalHandler);
  }

}
