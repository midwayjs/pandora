import {expect} from 'chai';
import {MetricsManager} from '../src/MetricsManager';
import {MetricsServerManager} from 'metrics-common';

describe('MetricsManager', () => {
  it('should be an instance of metrics-common#MetricsServerManager', () => {
    expect(new MetricsManager).to.be.an.instanceof(MetricsServerManager);
  });
});
