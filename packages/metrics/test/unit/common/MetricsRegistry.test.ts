import {MetricName} from '../../../src/common/MetricName';
import {expect} from 'chai';
import {MetricsRegistry} from '../../../src/common/MetricsRegistry';
import {BaseCounter} from '../../../src/common/metrics/Counter';
import {BaseGauge} from '../../../src/common/metrics/Gauge';
import {BaseHistogram} from '../../../src/common/metrics/Histogram';
import {BaseTimer} from '../../../src/common/metrics/Timer';
import {BaseMeter} from '../../../src/common/metrics/Meter';
import {MetricType} from '../../../src/common/MetricType';

describe('/test/unit/common/MetricsRegistry.test.ts', () => {
  it('test create a empty registry', () => {
    let registry = new MetricsRegistry();
    expect(registry.getKeys().length).to.be.equal(0);
  });

  it('test register a counter', () => {
    let registry = new MetricsRegistry();
    registry.counter(MetricName.build('test.hello.qps'));
    expect(registry.getKeys().length).to.be.equal(1);
    expect(registry.getMetric(MetricName.build('test.hello.qps'))).to.be.exist;
    expect(registry.getMetric(MetricName.build('test.hello.qps')).type).to.be.equal('COUNTER');
  });

  it('test register a gauge', () => {
    let registry = new MetricsRegistry();
    registry.register(MetricName.build('test.hello.qps'), <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    });
    expect(registry.getKeys().length).to.be.equal(1);
    expect(registry.getMetric(MetricName.build('test.hello.qps'))).to.be.exist;
    expect(registry.getMetric(MetricName.build('test.hello.qps')).type).to.be.equal('GAUGE');
  });

  it('test register a meter', () => {
    let registry = new MetricsRegistry();
    registry.meter(MetricName.build('test.hello.qps'));
    expect(registry.getKeys().length).to.be.equal(1);
    expect(registry.getMetric(MetricName.build('test.hello.qps'))).to.be.exist;
    expect(registry.getMetric(MetricName.build('test.hello.qps')).type).to.be.equal('METER');
  });

  it('test register a timer', () => {
    let registry = new MetricsRegistry();
    registry.timer(MetricName.build('test.hello.qps'));
    expect(registry.getKeys().length).to.be.equal(1);
    expect(registry.getMetric(MetricName.build('test.hello.qps'))).to.be.exist;
    expect(registry.getMetric(MetricName.build('test.hello.qps')).type).to.be.equal('TIMER');
  });

  it('test register a histogram', () => {
    let registry = new MetricsRegistry();
    registry.histogram(MetricName.build('test.hello.qps'));
    expect(registry.getKeys().length).to.be.equal(1);
    expect(registry.getMetric(MetricName.build('test.hello.qps'))).to.be.exist;
    expect(registry.getMetric(MetricName.build('test.hello.qps')).type).to.be.equal('HISTOGRAM');
  });

  it('test register a exist metric', () => {
    let counter = new BaseCounter();
    let gauge = <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    };
    let registry = new MetricsRegistry()
    registry.register(MetricName.build('test.hello.count'), counter);
    registry.register(MetricName.build('test.hello.qps'), gauge);

    counter.inc(5);

    expect(counter.getCount()).to.be.equal(5);
    expect(gauge.getValue()).to.be.equal(100);

    expect((<BaseCounter>registry.getMetric(MetricName.build('test.hello.count'))).getCount()).to.be.equal(5);
    expect((<BaseGauge<number>>registry.getMetric(MetricName.build('test.hello.qps'))).getValue()).to.be.equal(100);
  });

  it('get counters from registry', () => {
    let registry = new MetricsRegistry()
    registry.register(MetricName.build('test.hello.count'), new BaseCounter());
    registry.register(MetricName.build('test.hello.qps'), new BaseCounter());
    registry.register(MetricName.build('test.hello.a'), new BaseCounter());
    registry.register(MetricName.build('test.hello.b'), new BaseCounter());
    expect(registry.getCounters().size).to.be.equal(4);
  });

  it('get more category metrics from registry', () => {
    let registry = new MetricsRegistry();
    registry.register(MetricName.build('test.hello.count'), new BaseCounter());
    registry.register(MetricName.build('test.hello.qps'), <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    });
    registry.register(MetricName.build('test.hello.a'), <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    });
    registry.register(MetricName.build('test.hello.b'), <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    });
    registry.register(MetricName.build('test.hello.c'), new BaseHistogram());
    registry.register(MetricName.build('test.hello.d'), new BaseTimer());
    registry.register(MetricName.build('test.hello.e'), new BaseTimer());
    registry.register(MetricName.build('test.hello.f'), new BaseMeter());

    expect(registry.getCounters().size).to.be.equal(1);
    expect(registry.getGauges().size).to.be.equal(3);
    expect(registry.getHistograms().size).to.be.equal(1);
    expect(registry.getTimers().size).to.be.equal(2);
    expect(registry.getMeters().size).to.be.equal(1);
  });

  it('use get metric method to create metric', () => {
    let registry = new MetricsRegistry();
    expect(registry.counter(MetricName.build('test.hello.b')).type).to.be.equal(MetricType.COUNTER);
    expect(registry.histogram(MetricName.build('test.hello.c')).type).to.be.equal(MetricType.HISTOGRAM);
    expect(registry.meter(MetricName.build('test.hello.d')).type).to.be.equal(MetricType.METER);
    expect(registry.timer(MetricName.build('test.hello.e')).type).to.be.equal(MetricType.TIMER);
  });

  it('get names', () => {
    let registry = new MetricsRegistry();
    registry.register(MetricName.build('test.hello.count'), new BaseCounter());
    registry.register(MetricName.build('test.hello.qps'), <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    });
    expect(registry.getMetricNames().length).to.be.equal(2);
  });

  it('get metrics without parameters', () => {
    let registry = new MetricsRegistry();
    registry.register(MetricName.build('test.hello.count'), new BaseCounter());
    registry.register(MetricName.build('test.hello.qps'), <BaseGauge<number>> {
      getValue() {
        return 100;
      }
    });
    expect(registry.getMetrics().size).to.be.equal(2);
  });
});
