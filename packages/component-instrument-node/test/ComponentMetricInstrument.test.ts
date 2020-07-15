import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import * as assert from 'assert';
import { TestMeterProvider } from 'test-util';
import ComponentMetricInstrument from '../src/ComponentMetricInstrument';

describe('ComponentMetricInstrument', () => {
  it('should have correct meta info', () => {
    assert.strictEqual(
      ComponentReflector.getComponentName(
        ComponentMetricInstrument as IComponentConstructor
      ),
      'metricInstrument'
    );
    assert.deepStrictEqual(
      ComponentReflector.getDependencies(
        ComponentMetricInstrument as IComponentConstructor
      ),
      ['metric']
    );
  });

  it('should start at supervisor be ok', async () => {
    const ctx = {
      mode: 'supervisor',
      meterProvider: new TestMeterProvider(),
    };
    const componentMetricInstrument = new ComponentMetricInstrument(ctx);
    await componentMetricInstrument.startAtSupervisor();
  });

  it('should start at worker be ok', async () => {
    const ctx = {
      mode: 'worker',
      meterProvider: new TestMeterProvider(),
    };
    const componentMetricInstrument = new ComponentMetricInstrument(ctx);
    await componentMetricInstrument.start();
  });
});
