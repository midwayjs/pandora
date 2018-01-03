import {MetricsManagerClient} from '../../../src/client/MetricsManagerClient';
import {Counter, Gauge} from '../../../src/client/MetricsProxy';
import {expect} from 'chai';
import {MetricsProcessChannel} from '../../../src/client/MetricsProcessChannel';
import {MetricsConstants} from '../../../src/MetricsConstants';
import {MetricName} from '../../../src/common/MetricName';

class MetricsServer {

  groupMetricsMap = new Map();

  register(group, name, metric) {
    let groupMap = this.groupMetricsMap.get(group);
    if(!groupMap) {
      groupMap = [];
      this.groupMetricsMap.set(group, groupMap);
    }

    groupMap.push({
      name,
      metric
    });
  }

  getGroup(group) {
    return this.groupMetricsMap.get(group);
  }

  getMetric(name) {
    for(let metricObjectArr of this.groupMetricsMap.values()) {
      for(let metricObject of metricObjectArr) {
        if(name.toString() === metricObject.name.toString()) {
          return metricObject.metric;
        }
      }
    }
  }
}

describe('/test/unit/client/MetricsManager.test.ts', () => {

  const server = new MetricsServer();

  it('get metrics', () => {
    let counter = MetricsManagerClient.getCounter('test', 'test.qps.counter');
    let histogram = MetricsManagerClient.getHistogram('test', 'test.qps.histogram');
    let meter = MetricsManagerClient.getMeter('test', 'test.qps.meter');
    let timer = MetricsManagerClient.getTimer('test', 'test.qps.timer');

    counter.inc(1);
    counter.dec(1);
    histogram.update(5);
    meter.mark(4);
    timer.update(3, 1);

    expect(counter.inc).to.exist;
    expect(histogram.update).to.exist;
    expect(meter.mark).to.exist;
    expect(timer.update).to.exist;

  });

  it('register metric use outside', () => {
    global[MetricsConstants.GLOBAL_METRICS_KEY] = server;
    let counter = new Counter();
    let name = MetricName.build('test.qps.count');

    MetricsManagerClient.register('test', name, counter);
    counter.inc(5);
    counter.inc(5);
    counter.inc(5);
    counter.inc(5);

    expect(server.getMetric(name)).to.exist;
  });

  it('register gauge', () => {
    global[MetricsConstants.GLOBAL_METRICS_KEY] = server;
    let name = MetricName.build('test.qps.gauge');

    MetricsManagerClient.register('test', name,  <Gauge<number>> {
      getValue() {
        return 100;
      }
    });

    expect(server.getMetric(name)).to.exist;
    expect(server.getMetric(name).getValue()).to.equal(100);
  });

  it('get same instance', () => {
    let ins1 = MetricsProcessChannel.getInstance();
    let ins2 = MetricsProcessChannel.getInstance();

    expect(ins1).to.equal(ins2);
  });
});
