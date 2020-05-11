import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import { EventEmitter } from 'events';
import { TestMeterProvider, deepMatch } from 'test-util';
import * as assert from 'assert';
import ComponentDeadCounter from '../src/ComponentDeadCounter';

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
      ['ipcHub', 'metrics', 'errorLog']
    );
  });

  it('should record client_disconnected be ok', async () => {
    const errorRecorded = [];
    const meterProvider = new TestMeterProvider();
    const fakeHubServer = new EventEmitter();
    const fakeErrorLogManager = {
      record(info) {
        errorRecorded.push(info);
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

    assert.strictEqual(errorRecorded.length, 1);
    deepMatch(errorRecorded[0], {
      errType: 'processDisconnected',
      message: 'process disconnected PID: 12345',
      stack: '',
      traceId: '',
      path: 'component-dead-counter',
    });

    const counter = meterProvider.getMetricRecord('process_disconnected');
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
