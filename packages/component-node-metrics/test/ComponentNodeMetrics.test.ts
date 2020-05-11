import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import * as assert from 'assert';
import { TestMeterProvider } from 'test-util';
import ComponentNodeMetrics from '../src/ComponentNodeMetrics';

describe('ComponentNodeMetrics', () => {
  it('should have correct meta info', () => {
    assert.strictEqual(
      ComponentReflector.getComponentName(
        ComponentNodeMetrics as IComponentConstructor
      ),
      'nodeMetrics'
    );
    assert.deepStrictEqual(
      ComponentReflector.getDependencies(
        ComponentNodeMetrics as IComponentConstructor
      ),
      ['metrics']
    );
  });

  it('should start at supervisor be ok', async () => {
    const ctx = {
      mode: 'supervisor',
      meterProvider: new TestMeterProvider(),
    };
    const componentNodeMetrics = new ComponentNodeMetrics(ctx);
    await componentNodeMetrics.startAtSupervisor();
  });

  it('should start at worker be ok', async () => {
    const ctx = {
      mode: 'worker',
      meterProvider: new TestMeterProvider(),
    };
    const componentNodeMetrics = new ComponentNodeMetrics(ctx);
    await componentNodeMetrics.start();
  });
});
