import {expect} from 'chai';
import urllib = require('urllib');
import {BaseMonitor} from '../../src/monitor/Monitor';
import {DefaultEnvironment, EnvironmentUtil} from 'pandora-env';
import {MetricsConstants} from 'pandora-metrics';
import {Monitor} from '../../src';

describe('Monitor', function () {

  let monitor: Monitor = null;
  let beforeCurEnv = null;

  before(() => {
    monitor = new BaseMonitor;
    const daemonEnvironment = new DefaultEnvironment({
      processName: 'daemon',
      appName: MetricsConstants.METRICS_DEFAULT_APP
    });
    beforeCurEnv = EnvironmentUtil.getInstance().getCurrentEnvironment();
    EnvironmentUtil.getInstance().setCurrentEnvironment(daemonEnvironment);
  });

  after(async () => {
    EnvironmentUtil.getInstance().setCurrentEnvironment(beforeCurEnv);
  });

  it('should start() be ok', async () => {
    await monitor.start();
    const ret = await urllib.request('http://127.0.0.1:7002/');
    expect(ret.res.data.toString()).to.includes('restful service');
  });

  it('should stop() be ok', async () => {
    await monitor.stop();
    try {
      await urllib.request('http://127.0.0.1:7002/');
    } catch (err) {
      return;
    }
    throw new Error();
  });

});
