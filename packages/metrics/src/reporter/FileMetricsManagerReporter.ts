import {Environment, EnvironmentUtil} from 'pandora-env';
import {DefaultLoggerManager} from 'pandora-service-logger';
import {ScheduledMetricsReporter} from './ScheduledMetricsReporter';
import {BaseGauge, MetricName} from '../common/index';
import {MetricsCollector} from '../collect/MetricsCollector';
import {CompactMetricsCollector} from '../collect/CompactMetricsCollector';
import {join} from 'path';

export class FileMetricsManagerReporter extends ScheduledMetricsReporter {

  globalTags;
  logger;
  durationFactor;
  rateFactor;
  collectorCls;
  environment: Environment;

  constructor(actuatorManager, options: {
    rateFactor?: number,
    durationFactor?: number
    globalTags?: {},
    collector?: MetricsCollector
  }) {
    super(actuatorManager);
    this.globalTags = options.globalTags || {};
    this.collectorCls = options.collector || CompactMetricsCollector;
    this.environment = EnvironmentUtil.getInstance().getCurrentEnvironment();
    this.initFileAppender();
  }

  initFileAppender() {
    this.logger = DefaultLoggerManager.getInstance().createLogger('metrics', {
      type: 'size',
      maxFileSize: 200 * 1024 * 1024,
      dir: join(this.environment.get('pandoraLogsDir'), 'pandorajs'),
      stdoutLevel: 'NONE',
      level: 'ALL'
    });
  }

  async report(metricsData) {
    let {gauges, counters, histograms, meters, timers} = metricsData;
    const timestamp = Date.now();

    const collector = new this.collectorCls({
      globalTags: this.globalTags,
      rateFactor: this.rateFactor,
      durationFactor: this.durationFactor,
      reportInterval: this.interval,
    });

    let gaugesArr: BaseGauge<any>[] = Array.from(gauges.values());
    let results: number[] = await Promise.all(gaugesArr.map((gauge) => {
      return gauge.getValue();
    }));

    Array.from(gauges.keys()).forEach((key: string, index) => {
      collector.collectGauge(MetricName.parseKey(key), results[index], timestamp);
    });

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
        if (metricObject && metricObject.toJSON) {
          this.logger.write(JSON.stringify(metricObject.toJSON()));
        }
      }
    } catch (err) {
      console.error('write metrics data error!', err);
    }

  }
}
