import {
  BaseCounter,
  BaseHistogram,
  BaseMeter,
  BaseTimer,
  BucketCounter,
  MetricLevel,
  MetricName
} from '../../../src/common';
import {CompactMetricsCollector, MetricBuilder, MetricsCollector, NormalMetricsCollector} from '../../../src';
import {expect} from 'chai';
import {MetricsCollectPeriodConfig} from '../../../src/common/MetricsCollectPeriodConfig';

function findObject(arr, metricKey) {
  for (let o of arr) {
    if (o.metric === metricKey) {
      return o;
    }
  }
}

function delay(interval) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, interval);
  });
}

describe('/test/unit/collector/MetricsCollector.test.ts', () => {

  let timestamp = Date.now();

  it('should create new CompactMetricsCollector', async () => {
    const globalReportInterval = 2;
    MetricsCollectPeriodConfig.getInstance().configGlobalPeriod(globalReportInterval);

    let collector = new CompactMetricsCollector({globalTags: {}, rateFactor: 10, durationFactor: 10, reportInterval: globalReportInterval});
    let c1 = new BucketCounter();
    let c2 = new BucketCounter();
    let h1 = new BaseHistogram();
    let m1 = new BaseMeter();
    let t1 = new BaseTimer();

    c1.inc();
    c2.inc();

    await delay(2100);

    collector.collectGauge(MetricName.build('collector.gauge'), 10, timestamp);
    collector.collectCounter(MetricName.build('collector.counter'), c1, timestamp);
    collector.collectCounter(MetricName.build('collector.basecounter'), c2, timestamp);
    collector.collectHistogram(MetricName.build('collector.histogram'), h1, timestamp);
    collector.collectMeter(MetricName.build('collector.meter'), m1, timestamp);
    collector.collectTimer(MetricName.build('collector.timer'), t1, timestamp);
    let results = collector.build();

    expect(findObject(results, 'collector.gauge').interval).to.equal(-1);
    expect(findObject(results, 'collector.gauge').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.gauge').metricType).to.equal('GAUGE');

    expect(findObject(results, 'collector.counter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.counter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.basecounter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.basecounter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.basecounter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.counter.bucket_count').interval).to.equal(2);
    expect(findObject(results, 'collector.counter.bucket_count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.bucket_count').metricType).to.equal('DELTA');

    // expect(findObject(results, 'collector.counter.qps').interval).to.equal(1);
    // expect(findObject(results, 'collector.counter.qps').timestamp.toString().length).to.equal(13);
    // expect(findObject(results, 'collector.counter.qps').metricType).to.equal('GAUGE');

    expect(findObject(results, 'collector.histogram.mean').interval).to.equal(-1);
    expect(findObject(results, 'collector.histogram.mean').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.histogram.mean').metricType).to.equal('GAUGE');

    expect(findObject(results, 'collector.meter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.meter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.meter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.meter.m1').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.meter.m1')).to.exist;
    expect(findObject(results, 'collector.meter.m5')).to.not.exist;

    expect(findObject(results, 'collector.timer.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.timer.count').metricType).to.equal('COUNTER');
    expect(findObject(results, 'collector.timer.m1')).to.exist;
    expect(findObject(results, 'collector.timer.rt')).to.exist;
    expect(findObject(results, 'collector.timer.mean')).to.exist;
    expect(findObject(results, 'collector.timer.bucket_count')).to.exist;
    expect(findObject(results, 'collector.timer.qps')).to.exist;
    expect(findObject(results, 'collector.timer.median')).to.not.exist;
    expect(findObject(results, 'collector.timer.p99')).to.not.exist;
    expect(findObject(results, 'collector.timer.p95')).to.not.exist;
    expect(findObject(results, 'collector.timer.p75')).to.not.exist;
    expect(findObject(results, 'collector.timer.bucket_count').metricType).to.equal('DELTA');
  });

  it('should create new NormalMetricsCollector', async () => {
    let collector = new NormalMetricsCollector({globalTags: {}, rateFactor: 10, durationFactor: 10});
    collector.collectGauge(MetricName.build('collector.gauge'), 10, timestamp);
    collector.collectCounter(MetricName.build('collector.counter'), new BucketCounter(), timestamp);
    collector.collectCounter(MetricName.build('collector.basecounter'), new BaseCounter(), timestamp);
    collector.collectHistogram(MetricName.build('collector.histogram'), new BaseHistogram(), timestamp);
    collector.collectMeter(MetricName.build('collector.meter'), new BaseMeter(), timestamp);
    collector.collectTimer(MetricName.build('collector.timer'), new BaseTimer(), timestamp);


    let results = collector.build();
    expect(findObject(results, 'collector.gauge').interval).to.equal(-1);
    expect(findObject(results, 'collector.gauge').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.gauge').metricType).to.equal('GAUGE');

    expect(findObject(results, 'collector.basecounter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.basecounter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.basecounter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.counter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.counter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.counter.bucket_count').interval).to.equal(1);
    expect(findObject(results, 'collector.counter.bucket_count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.bucket_count').metricType).to.equal('DELTA');

    expect(findObject(results, 'collector.counter.qps').interval).to.equal(1);
    expect(findObject(results, 'collector.counter.qps').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.qps').metricType).to.equal('GAUGE');

    expect(findObject(results, 'collector.histogram.mean').interval).to.equal(-1);
    expect(findObject(results, 'collector.histogram.mean').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.histogram.mean').metricType).to.equal('GAUGE');
    expect(findObject(results, 'collector.histogram.min')).to.exist;
    expect(findObject(results, 'collector.histogram.max')).to.exist;
    expect(findObject(results, 'collector.histogram.median')).to.exist;
    expect(findObject(results, 'collector.histogram.p75')).to.exist;
    expect(findObject(results, 'collector.histogram.p95')).to.exist;
    expect(findObject(results, 'collector.histogram.p99')).to.exist;


    expect(findObject(results, 'collector.meter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.meter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.meter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.meter.m1').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.meter.m1')).to.exist;
    expect(findObject(results, 'collector.meter.m5')).to.exist;
    expect(findObject(results, 'collector.meter.m15')).to.exist;

    expect(findObject(results, 'collector.timer.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.timer.count').metricType).to.equal('COUNTER');
    expect(findObject(results, 'collector.timer.m1')).to.exist;
    expect(findObject(results, 'collector.timer.rt')).to.exist;
    expect(findObject(results, 'collector.timer.mean')).to.exist;
    expect(findObject(results, 'collector.timer.median')).to.exist;
    expect(findObject(results, 'collector.timer.p99')).to.exist;
    expect(findObject(results, 'collector.timer.p95')).to.exist;
    expect(findObject(results, 'collector.timer.p75')).to.exist;
    expect(findObject(results, 'collector.timer.bucket_count')).to.exist;
    expect(findObject(results, 'collector.timer.qps')).to.exist;
    expect(findObject(results, 'collector.timer.bucket_count').metricType).to.equal('DELTA');
  });

  it('should test getNormalizedStartTime', function () {
    let collector = new MetricsCollector({globalTags: {}, rateFactor: 10, durationFactor: 1});
    expect(collector.getNormalizedStartTime(1514887712411, 10)).to.equal(1514887700000);
    expect(collector.getNormalizedStartTime(1514887712411, 15)).to.equal(1514887695000);
    expect(collector.getNormalizedStartTime(1514887712411, 20)).to.equal(1514887680000);
  });

  it('should test output interval value', async () => {
    const globalReportInterval = 2;
    MetricsCollectPeriodConfig.getInstance().configGlobalPeriod(globalReportInterval);

    let collector = new CompactMetricsCollector({globalTags: {}, rateFactor: 10, durationFactor: 10, reportInterval: globalReportInterval});
    collector.collectGauge(MetricName.build('collector.gauge').setLevel(MetricLevel.MAJOR), 10, timestamp);

    let name1 = MetricName.build('collector.counter').setLevel(MetricLevel.NORMAL);
    let c1 = MetricBuilder.COUNTERS.newMetric(name1);
    c1.inc(1);
    let name2 = MetricName.build('collector.basecounter').setLevel(MetricLevel.CRITICAL);
    let c2 =  MetricBuilder.COUNTERS.newMetric(name2);
    c2.inc(1);
    let name3 = MetricName.build('collector.histogram').setLevel(MetricLevel.MINOR);
    let h3 = MetricBuilder.HISTOGRAMS.newMetric(name3);
    let name4 = MetricName.build('collector.meter').setLevel(MetricLevel.TRIVIAL);
    let m4 = MetricBuilder.METERS.newMetric(name4);

    await delay(2100);

    collector.collectCounter(name1, c1, timestamp);
    collector.collectCounter(name2, c2, timestamp);
    collector.collectHistogram(name3, h3, timestamp);
    collector.collectMeter(name4, m4, timestamp);

    let results = collector.build();
    expect(findObject(results, 'collector.gauge').interval).to.equal(-1);
    expect(findObject(results, 'collector.counter.bucket_count').interval).to.equal(2);
    expect(findObject(results, 'collector.basecounter.bucket_count').interval).to.equal(2);
    expect(findObject(results, 'collector.histogram.mean').interval).to.equal(-1);
    expect(findObject(results, 'collector.meter.m1').interval).to.equal(-1);
  });

});
