import {expect} from 'chai';
import {Gauge as GaugeProxy} from '../../../src/client/MetricsProxy';
import {CachedMetricSet} from '../../../src/client/CachedMetricSet';
import {MetricName} from '../../../src/common/MetricName';
import {BaseGauge} from '../../../src/common/metrics/Gauge';

class TestCachedMetricSet extends CachedMetricSet {

  caches;

  getValueInternal() {
    this.caches = {
      a: Math.random(),
      b: Math.random(),
    };
  }

  getMetrics() {
    let results = [];
    let self = this;

    results.push({
      name: MetricName.build('test.a'),
      metric: <BaseGauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.caches['a'];
        }
      }
    });

    results.push({
      name: MetricName.build('test.b'),
      metric: <GaugeProxy<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.caches['b'];
        }
      }
    });

    return results;
  }

}

describe('/test/unit/client/CachedMetricSet.test.ts', () => {
  it('create a cached metric set and compare after cache timeout', async () => {

    let metricSet = new TestCachedMetricSet(1);
    let metrics = metricSet.getMetrics();

    let A = await (<BaseGauge<any>>metrics[0].metric).getValue();
    let B = await (<BaseGauge<any>>metrics[1].metric).getValue();

    setTimeout(async () => {
      let valueA = await (<BaseGauge<any>>metrics[0].metric).getValue();
      let valueB = await (<BaseGauge<any>>metrics[1].metric).getValue();
      expect(A === valueA).to.true;
      expect(B === valueB).to.true;
    }, 500);

    setTimeout(async () => {
      let valueA = await (<BaseGauge<any>>metrics[0].metric).getValue();
      let valueB = await (<BaseGauge<any>>metrics[1].metric).getValue();
      expect(A !== valueA).to.true;
      expect(B !== valueB).to.true;
    }, 1500);
  });
});
