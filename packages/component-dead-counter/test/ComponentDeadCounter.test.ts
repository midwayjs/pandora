import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import { EventEmitter } from 'events';
import { TestMeterProvider, deepMatch } from 'test-util';
import * as assert from 'assert';
import ComponentDeadCounter from '../src/ComponentDeadCounter';
import { PandoraMetric } from '@pandorajs/semantic-conventions';

describe('ComponentDeadCounter', () => {
  it('should have correct meta info', () => {
    assert.strictEqual(
      ComponentReflector.getComponentName(
        ComponentDeadCounter as IComponentConstructor
      ),
      'deadCounter'
    );
    assert.deepStrictEqual(
      ComponentReflector.getDependencies(
        ComponentDeadCounter as IComponentConstructor
      ),
      ['ipcHub', 'metric']
    );
  });

  it('should record client_disconnected be ok', async () => {
    const meterProvider = new TestMeterProvider();
    const fakeHubServer = new EventEmitter();

    await new ComponentDeadCounter({
      mode: 'supervisor',
      meterProvider,
      hubServer: fakeHubServer,
    }).startAtSupervisor();

    fakeHubServer.emit('client_disconnected', [
      { initialization: true, clientId: 'nope' },
      { clientId: 'nope', pid: '12345' },
    ]);

    const counter = meterProvider.getMetricRecord(
      PandoraMetric.CLIENT_DISCONNECTED
    );
    assert.strictEqual(counter.aggregator.toPoint().value, 1);
  });

  it('should avoid error be ok', async () => {
    const meterProvider = new TestMeterProvider();
    const fakeHubServer = new EventEmitter();
    const fakeErrorLogManager = {
      record(info) {
        throw new Error('testError');
      },
    };

    await new ComponentDeadCounter({
      mode: 'supervisor',
      meterProvider,
      hubServer: fakeHubServer,
      errorLogManager: fakeErrorLogManager,
    }).startAtSupervisor();

    fakeHubServer.emit('client_disconnected', [
      { initialization: true, clientId: 'nope' },
      { clientId: 'nope', pid: '12345' },
    ]);
  });
});
