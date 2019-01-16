import {expect} from 'chai';
import {BaseGauge} from 'metrics-common';
import {MetricsOscillator} from '../../src/oscillator/MetricsOscillator';
import {MetricsManager} from 'pandora-component-metrics';


describe('MetricsOscillator', () => {

  it('should collect() be ok', async () => {

    const metricsManager: MetricsManager = new MetricsManager;
    metricsManager.register('test', 'test.Gauge', <BaseGauge<number>> {
      getValue() {
        return 1;
      }
    });
    metricsManager.getCounter('test', 'test.Counter');
    metricsManager.getHistogram('test', 'test.Histogram');
    metricsManager.getMeter('test', 'test.Meter');
    metricsManager.getTimer('test', 'test.Timer');
    metricsManager.getFastCompass('test', 'test.FastCompass');

    const metricsOscillator: MetricsOscillator = new MetricsOscillator(metricsManager, {
      interval: 60 * 1000
    });

    let gotData;
    metricsOscillator.on('oscillate', (data) => {
      gotData = data;
    });
    await metricsOscillator.collect();

    const expectedPrefixes = [
      'test.Gauge',
      'test.Counter',
      'test.Histogram',
      'test.Meter',
      'test.Timer',
      'test.FastCompass'
    ];

    prefixLoopTag: for(const prefix of expectedPrefixes) {
      for(const metricData of gotData) {
        if(metricData.metric.startsWith(prefix)) {
          continue prefixLoopTag;
        }
      }
      throw new Error('no metric ' + prefix);
    }

  });

  it('should collect() avoid error be ok', async () => {

    const metricsManager: MetricsManager = new MetricsManager;
    metricsManager.getCounter('test', 'test.Counter');
    const metricsOscillator: MetricsOscillator = new MetricsOscillator(metricsManager, {
      interval: 60 * 1000
    });

    metricsOscillator.on('oscillate', (data) => {
      throw new Error('Fake Error');
    });
    await metricsOscillator.collect();

  });

  it('should never emit oscillate when got an empty collect result', async () => {

    const metricsManager: MetricsManager = new MetricsManager;
    const metricsOscillator: MetricsOscillator = new MetricsOscillator(metricsManager, {
      interval: 60 * 1000
    });
    let gotData;
    metricsOscillator.on('oscillate', (data) => {
      gotData = data;
    });
    await metricsOscillator.collect();
    expect(gotData).to.be.undefined;

  });


  it('should oscillate for each interval be ok', async () => {

    const metricsManager: MetricsManager = new MetricsManager;
    metricsManager.register('test', 'test.Gauge', <BaseGauge<number>> {
      getValue() {
        return 1;
      }
    });
    metricsManager.getCounter('test', 'test.Counter');
    metricsManager.getHistogram('test', 'test.Histogram');
    metricsManager.getMeter('test', 'test.Meter');
    metricsManager.getTimer('test', 'test.Timer');
    metricsManager.getFastCompass('test', 'test.FastCompass');

    const metricsOscillator: MetricsOscillator = new MetricsOscillator(metricsManager, {
      interval: 1000
    });

    let gotData;
    metricsOscillator.on('oscillate', (data) => {
      gotData = data;
    });

    metricsOscillator.start();
    // start twice for else branch
    metricsOscillator.start();

    await new Promise(resolve => setTimeout(resolve, 1500));

    const expectedPrefixes = [
      'test.Gauge',
      'test.Counter',
      'test.Histogram',
      'test.Meter',
      'test.Timer',
      'test.FastCompass'
    ];

    prefixLoopTag: for(const prefix of expectedPrefixes) {
      for(const metricData of gotData) {
        if(metricData.metric.startsWith(prefix)) {
          continue prefixLoopTag;
        }
      }
      throw new Error('no metric ' + prefix);
    }

    metricsOscillator.stop();
    // start twice for else branch
    metricsOscillator.stop();

    expect(metricsOscillator.intervalHandler).to.be.null;

  });

  it('should avoid error for each interval be ok', async () => {

    // make metricsManager be an illegal object to raise typeError
    const metricsManager: MetricsManager = <any> {};

    const metricsOscillator: MetricsOscillator = new MetricsOscillator(metricsManager, {
      interval: 1000
    });

    metricsOscillator.on('oscillate', (data) => {
      throw new Error('fake Error');
    });
    metricsOscillator.start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    metricsOscillator.stop();

  });


});
