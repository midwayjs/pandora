import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from '@pandorajs/component-decorator';
import ComponentSystemMetrics from '../src/ComponentSystemMetrics';
import {MetricsServerManager} from 'metrics-common';

describe('ComponentSystemMetrics', () => {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentSystemMetrics)).to.be.equal('systemMetrics');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentSystemMetrics)).to.deep.equal(['metrics']);
  });

  it('should startAtSupervisor() be ok', async () => {
    const ctx: any = {
      metricsManager: new MetricsServerManager
    };
    const componentSystemMetrics = new ComponentSystemMetrics(ctx);
    await componentSystemMetrics.startAtSupervisor();
  });

});
