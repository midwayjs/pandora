import {Reporter} from '../domain';
import {
  MetricType
} from '../common/index';
const debug = require('debug')('pandora:metrics:schedule-reporter');

export abstract class CustomReporter implements Reporter {

  options;
  intervalHandler;
  metricManager;
  endPointService;

  constructor(actuatorManager, options: {
    rateFactor?: number,
    durationFactor?: number
  } = {}) {
    this.options = options;
    this.metricManager = actuatorManager.getMetricsManager();
    this.endPointService = actuatorManager.getEndPointService();
  }

  start(interval) {
    if(!this.intervalHandler) {
      this.intervalHandler = setInterval(async () => {
        debug('exec report once');
        try {
          await this.report();
        } catch (err) {
          console.error(err);
        }
      }, interval * 1000);
    }
  }

  getCategoryMetrics() {
    const categoryMetrics = this.metricManager.getAllCategoryMetrics();
    return {
      gauges: categoryMetrics.get(MetricType.GAUGE),
      counters: categoryMetrics.get(MetricType.COUNTER),
      histograms: categoryMetrics.get(MetricType.HISTOGRAM),
      meters: categoryMetrics.get(MetricType.METER),
      timers: categoryMetrics.get(MetricType.TIMER)
    };
  }

  abstract report();

  stop() {
    this.intervalHandler && clearInterval(this.intervalHandler);
  }

}
