import {expect} from 'chai';
import {MetricsIndicator} from '../src/MetricsIndicator';
import {MetricsManager} from '../src/MetricsManager';
import {BaseGauge} from 'metrics-common';

require('chai').use(require('chai-as-promised'));

describe('MetricsIndicator', () => {

  it('should listMetrics() be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.getCounter('test', 'test');
    const res = await metricsIndicator.listMetrics();
    expect(res['test'].length).to.be.equal(1);
  });

  it('should listMetrics() with group be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.getCounter('test', 'test');
    const res = await metricsIndicator.listMetrics('test');
    expect(res['test'].length).to.be.equal(1);
  });

  it('should listMetrics() with group be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.getCounter('test', 'test');
    const res = await metricsIndicator.listMetrics('test');
    expect(res['test'].length).to.be.equal(1);
  });

  it('should listMetrics() with group that not exist be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.getCounter('test', 'test');
    const res = await metricsIndicator.listMetrics('test111');
    expect(Object.keys(res).length).to.be.equal(0);
  });

  it('should buildMetricRegistry() be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.register('test', 'Gauge', <BaseGauge<number>> {
      getValue() {
        return 1;
      }
    });
    metricsManager.getCounter('test', 'Counter');
    metricsManager.getHistogram('test', 'Histogram');
    metricsManager.getMeter('test', 'Meter');
    metricsManager.getTimer('test', 'Timer');
    metricsManager.getFastCompass('test', 'FastCompass');
    const res = await metricsIndicator.buildMetricRegistry(metricsManager.getMetricRegistryByGroup('test'));
    expect(res.length).to.be.equal(37);
  });

  it('should getMetricsByGroup() be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.register('test', 'Gauge', <BaseGauge<number>> {
      getValue() {
        return 1;
      }
    });
    const res = await metricsIndicator.getMetricsByGroup('test');
    expect(res.length).to.be.equal(1);
  });

  it('should getMetricsByGroup() throw error be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    await expect(metricsIndicator.getMetricsByGroup('test1')).to.be.rejectedWith('The specified group is not found!');
  });

  it('should invoke() be ok', async () => {
    const metricsManager: MetricsManager = new MetricsManager;
    const metricsIndicator: MetricsIndicator = new MetricsIndicator(metricsManager);
    metricsManager.register('test', 'Gauge', <BaseGauge<number>> {
      getValue() {
        return 1;
      }
    });
    const res1 = await metricsIndicator.invoke({
      action: 'list'
    });
    expect(res1['test'].length).to.be.equal(1);
    const res2 = await metricsIndicator.invoke({
      action: 'group',
      group: 'test'
    });
    expect(res2.length).to.be.equal(1);

    // avoid error when unexpected action
    await metricsIndicator.invoke({
      action: <any> '~~~'
    });

  });

});
