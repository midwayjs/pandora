import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import {expect} from 'chai';
import {MetricsServerManager} from 'metrics-common';
import ComponentNodeMetrics from '../src/ComponentNodeMetrics';

describe('ComponentNodeMetrics', () => {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentNodeMetrics)).to.be.equal('nodeMetrics');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentNodeMetrics)).to.deep.equal(['metrics']);
  });

  it('should start at supervisor be ok', async () => {
    const ctx = {
      mode: 'supervisor',
      metricsManager: new MetricsServerManager
    };
    const componentNodeMetrics = new ComponentNodeMetrics(ctx);
    await componentNodeMetrics.startAtSupervisor();
  });

  it('should start at supervisor be ok', async () => {
    const ctx = {
      mode: 'worker',
      metricsManager: new MetricsServerManager
    };
    const componentNodeMetrics = new ComponentNodeMetrics(ctx);
    await componentNodeMetrics.start();
  });

});
