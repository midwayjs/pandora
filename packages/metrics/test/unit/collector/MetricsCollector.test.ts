import {
  BaseCounter, BaseGauge, BaseHistogram, BaseMeter, BaseTimer, BucketCounter,
  MetricName
} from '../../../src/common';
import {CompactMetricsCollector, NormalMetricsCollector} from '../../../src';
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
    await collector.collectGauge(MetricName.build('collector.gauge'), <BaseGauge<number>>{
      getValue(): number {
        return 10;
      }
    }, timestamp);
    collector.collectCounter(MetricName.build('collector.counter'), new BucketCounter(), timestamp);
    collector.collectCounter(MetricName.build('collector.basecounter'), new BaseCounter(), timestamp);
    collector.collectHistogram(MetricName.build('collector.histogram'), new BaseHistogram(), timestamp);
    collector.collectMeter(MetricName.build('collector.meter'), new BaseMeter(), timestamp);
    collector.collectTimer(MetricName.build('collector.timer'), new BaseTimer(), timestamp);

    let results = collector.build();

    expect(findObject(results, 'collector.gauge').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.gauge').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.gauge').metricType).to.be.equal('GAUGE');

    expect(findObject(results, 'collector.counter.count').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.counter.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.counter.count').metricType).to.be.equal('COUNTER');

    expect(findObject(results, 'collector.basecounter.count').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.basecounter.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.basecounter.count').metricType).to.be.equal('COUNTER');

    expect(findObject(results, 'collector.counter.bucket_count').interval).to.be.equal(1);
    expect(findObject(results, 'collector.counter.bucket_count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.counter.bucket_count').metricType).to.be.equal('DELTA');

    expect(findObject(results, 'collector.counter.qps').interval).to.be.equal(1);
    expect(findObject(results, 'collector.counter.qps').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.counter.qps').metricType).to.be.equal('GAUGE');

    expect(findObject(results, 'collector.histogram.mean').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.histogram.mean').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.histogram.mean').metricType).to.be.equal('GAUGE');

    expect(findObject(results, 'collector.meter.count').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.meter.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.meter.count').metricType).to.be.equal('COUNTER');

    expect(findObject(results, 'collector.meter.m1').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.meter.m1')).to.be.exist;
    expect(findObject(results, 'collector.meter.m5')).to.be.not.exist;

    expect(findObject(results, 'collector.timer.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.timer.count').metricType).to.be.equal('COUNTER');
    expect(findObject(results, 'collector.timer.m1')).to.be.exist;
    expect(findObject(results, 'collector.timer.rt')).to.be.exist;
    expect(findObject(results, 'collector.timer.mean')).to.be.exist;
    expect(findObject(results, 'collector.timer.bucket_count')).to.be.exist;
    expect(findObject(results, 'collector.timer.qps')).to.be.exist;
    expect(findObject(results, 'collector.timer.median')).to.be.not.exist;
    expect(findObject(results, 'collector.timer.p99')).to.be.not.exist;
    expect(findObject(results, 'collector.timer.p95')).to.be.not.exist;
    expect(findObject(results, 'collector.timer.p75')).to.be.not.exist;
    expect(findObject(results, 'collector.timer.bucket_count').metricType).to.be.equal('DELTA');
  });

  it('should create new NormalMetricsCollector', async () => {
    let collector = new NormalMetricsCollector({}, 10, 10);
    await collector.collectGauge(MetricName.build('collector.gauge'), <BaseGauge<number>>{
      getValue(): number {
        return 10;
      }
    }, timestamp);
    collector.collectCounter(MetricName.build('collector.counter'), new BucketCounter(), timestamp);
    collector.collectCounter(MetricName.build('collector.basecounter'), new BaseCounter(), timestamp);
    collector.collectHistogram(MetricName.build('collector.histogram'), new BaseHistogram(), timestamp);
    collector.collectMeter(MetricName.build('collector.meter'), new BaseMeter(), timestamp);
    collector.collectTimer(MetricName.build('collector.timer'), new BaseTimer(), timestamp);


    let results = collector.build();
    expect(findObject(results, 'collector.gauge').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.gauge').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.gauge').metricType).to.be.equal('GAUGE');

    expect(findObject(results, 'collector.basecounter.count').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.basecounter.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.basecounter.count').metricType).to.be.equal('COUNTER');

    expect(findObject(results, 'collector.counter.count').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.counter.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.counter.count').metricType).to.be.equal('COUNTER');

    expect(findObject(results, 'collector.counter.bucket_count').interval).to.be.equal(1);
    expect(findObject(results, 'collector.counter.bucket_count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.counter.bucket_count').metricType).to.be.equal('DELTA');

    expect(findObject(results, 'collector.counter.qps').interval).to.be.equal(1);
    expect(findObject(results, 'collector.counter.qps').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.counter.qps').metricType).to.be.equal('GAUGE');

    expect(findObject(results, 'collector.histogram.mean').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.histogram.mean').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.histogram.mean').metricType).to.be.equal('GAUGE');
    expect(findObject(results, 'collector.histogram.min')).to.be.exist;
    expect(findObject(results, 'collector.histogram.max')).to.be.exist;
    expect(findObject(results, 'collector.histogram.median')).to.be.exist;
    expect(findObject(results, 'collector.histogram.p75')).to.be.exist;
    expect(findObject(results, 'collector.histogram.p95')).to.be.exist;
    expect(findObject(results, 'collector.histogram.p99')).to.be.exist;


    expect(findObject(results, 'collector.meter.count').interval).to.be.equal(-1);
    expect(findObject(results, 'collector.meter.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.meter.count').metricType).to.be.equal('COUNTER');

    expect(findObject(results, 'collector.meter.m1').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.meter.m1')).to.be.exist;
    expect(findObject(results, 'collector.meter.m5')).to.be.exist;
    expect(findObject(results, 'collector.meter.m15')).to.be.exist;

    expect(findObject(results, 'collector.timer.count').timestamp.toString().length).to.be.equal(13);
    expect(findObject(results, 'collector.timer.count').metricType).to.be.equal('COUNTER');
    expect(findObject(results, 'collector.timer.m1')).to.be.exist;
    expect(findObject(results, 'collector.timer.rt')).to.be.exist;
    expect(findObject(results, 'collector.timer.mean')).to.be.exist;
    expect(findObject(results, 'collector.timer.median')).to.be.exist;
    expect(findObject(results, 'collector.timer.p99')).to.be.exist;
    expect(findObject(results, 'collector.timer.p95')).to.be.exist;
    expect(findObject(results, 'collector.timer.p75')).to.be.exist;
    expect(findObject(results, 'collector.timer.bucket_count')).to.be.exist;
    expect(findObject(results, 'collector.timer.qps')).to.be.exist;
    expect(findObject(results, 'collector.timer.bucket_count').metricType).to.be.equal('DELTA');
  });
});
