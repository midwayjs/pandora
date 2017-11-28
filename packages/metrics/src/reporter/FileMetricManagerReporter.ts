import {DefaultLoggerManager} from 'pandora-service-logger';
import {ScheduledMetricsReporter} from './ScheduledMetricsReporter';
import {
  MetricName
} from '../common/index';
import {CollectLevel, MetricsCollectorFactory} from '../collect/MetricsCollectorFactory';

export class FileMetricManagerReporter extends ScheduledMetricsReporter {

  globalTags;
  logger;
  durationFactor;
  rateFactor;

  constructor(actuatorManager, globalTags = {}) {
    super(actuatorManager);

    this.globalTags = globalTags;
    this.initFileAppender();
  }

  initFileAppender() {
    this.logger = DefaultLoggerManager.getInstance().createLogger('metrics', {
      type: 'size',
      maxFiles: 200 * 1024 * 1024,
      dir: DefaultLoggerManager.getPandoraLogsDir(),
      stdoutLevel: 'NONE',
      level: 'ALL'
    });
  }

  async report(metricsData) {
    let {gauges, counters, histograms, meters, timers} = metricsData;
    const timestamp = Date.now();

    const collector =
      MetricsCollectorFactory.create(CollectLevel.COMPACT, this.globalTags, this.rateFactor, this.durationFactor);

    for (let [key, gauge] of gauges.entries()) {
      await collector.collectGauge(MetricName.parseKey(key), gauge, timestamp);
    }

    for (let [key, counter] of counters.entries()) {
      collector.collectCounter(MetricName.parseKey(key), counter, timestamp);
    }

    for (let [key, histogram] of histograms.entries()) {
      collector.collectHistogram(MetricName.parseKey(key), histogram, timestamp);
    }

    for (let [key, meter] of meters.entries()) {
      collector.collectMeter(MetricName.parseKey(key), meter, timestamp);
    }

    for (let [key, timer] of timers.entries()) {
      collector.collectTimer(MetricName.parseKey(key), timer, timestamp);
    }

    try {
      // 只显示 metrics 的 report
      for (let metricObject of collector.build()) {
        if(metricObject && metricObject.toJSON) {
          this.logger.write(JSON.stringify(metricObject.toJSON()));
        }
      }
    } catch (err) {
      console.error('write metrics data error!', err);
    }

  }
}
