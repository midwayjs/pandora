import {
  BaseCounter, BaseHistogram, BaseMeter, BaseTimer, BucketCounter,
  MetricName
} from '../../../src/common';
import {CompactMetricsCollector, MetricsCollector, NormalMetricsCollector} from '../../../src';
import {expect} from 'chai';

function findObject(arr, metricKey) {
  for(let o of arr) {
    if(o.metric === metricKey) {
      return o;
    }
  }
}

describe('/test/unit/collector/MetricsCollector.test.ts', () => {

  let timestamp = Date.now();

  it('should create new CompactMetricsCollector', async () => {

    let collector = new CompactMetricsCollector({}, 10, 10);
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

    expect(findObject(results, 'collector.counter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.counter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.basecounter.count').interval).to.equal(-1);
    expect(findObject(results, 'collector.basecounter.count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.basecounter.count').metricType).to.equal('COUNTER');

    expect(findObject(results, 'collector.counter.bucket_count').interval).to.equal(1);
    expect(findObject(results, 'collector.counter.bucket_count').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.bucket_count').metricType).to.equal('DELTA');

    expect(findObject(results, 'collector.counter.qps').interval).to.equal(1);
    expect(findObject(results, 'collector.counter.qps').timestamp.toString().length).to.equal(13);
    expect(findObject(results, 'collector.counter.qps').metricType).to.equal('GAUGE');

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
    let collector = new NormalMetricsCollector({}, 10, 10);
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
    let collector = new MetricsCollector({}, 10, 10);
    expect(collector.getNormalizedStartTime(1514887712411, 10)).to.equal(1514887700000);
    expect(collector.getNormalizedStartTime(1514887712411, 15)).to.equal(1514887695000);
    expect(collector.getNormalizedStartTime(1514887712411, 20)).to.equal(1514887680000);
  });
});
