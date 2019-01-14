import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentDeadCounter from '../src/ComponentDeadCounter';
import { MetricsServerManager } from 'metrics-common';
import {EventEmitter} from 'events';


describe('ComponentDeadCounter', function () {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentDeadCounter)).to.be.equal('deadCounter');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentDeadCounter)).to.be.deep.equal(['ipcHub', 'metrics', 'errorLog']);
  });

  it('should record client_disconnected be ok', () => {

    const errorRecorded = [];
    const fakeMetricsManager = new MetricsServerManager;
    const fakeHubServer = new EventEmitter;
    const fakeErrorLogManager = {
      record (info) {
        errorRecorded.push(info);
      }
    };

    new ComponentDeadCounter({
      mode: 'supervisor',
      metricsManager: fakeMetricsManager,
      hubServer: fakeHubServer,
      errorLogManager: fakeErrorLogManager
    });

    fakeHubServer.emit('client_disconnected', [
      { initialization: true, clientId: 'nope' },
      { clientId: 'nope', pid: '12345' },
    ]);

    expect(errorRecorded.length).to.be.equal(1);
    expect(errorRecorded[0]).to.be.deep.include({
       errType: 'processDisconnected',
       message: 'process disconnected PID: 12345',
       stack: '',
       traceId: '',
       path: 'component-dead-counter'
    });

    const counter = fakeMetricsManager.getCounter('supervisor', 'process_disconnected');
    expect(counter.getCount()).to.be.equal(1);

  });

  it('should avoid error be ok', () => {

    const fakeMetricsManager = new MetricsServerManager;
    const fakeHubServer = new EventEmitter;
    const fakeErrorLogManager = {
      record (info) {
        throw new Error('testError');
      }
    };

    new ComponentDeadCounter({
      mode: 'supervisor',
      metricsManager: fakeMetricsManager,
      hubServer: fakeHubServer,
      errorLogManager: fakeErrorLogManager
    });

    fakeHubServer.emit('client_disconnected', [
      { initialization: true, clientId: 'nope' },
      { clientId: 'nope', pid: '12345' },
    ]);

  });

  it('should do nothing at worker mode be ok', () => {

    const errorRecorded = [];
    const fakeMetricsManager = new MetricsServerManager;
    const fakeHubServer = new EventEmitter;
    const fakeErrorLogManager = {
      record (info) {
        errorRecorded.push(info);
      }
    };

    new ComponentDeadCounter({
      mode: 'worker',
      metricsManager: fakeMetricsManager,
      hubServer: fakeHubServer,
      errorLogManager: fakeErrorLogManager
    });

    fakeHubServer.emit('client_disconnected', [
      { initialization: true, clientId: 'nope' },
      { clientId: 'nope', pid: '12345' },
    ]);

    expect(errorRecorded.length).to.be.equal(0);

    const counter = fakeMetricsManager.getCounter('supervisor', 'process_disconnected');
    expect(counter.getCount()).to.be.equal(0);

  });

});
