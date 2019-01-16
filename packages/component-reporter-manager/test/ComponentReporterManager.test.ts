import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentReporterManager from '../src/ComponentReporterManager';
import {EventEmitter} from 'events';

describe('ComponentReporterManager', () => {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentReporterManager)).to.be.equal('reporterManager');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentReporterManager)).to.deep.equal(['metrics', 'trace', 'errorLog']);
    expect(ComponentReflector.getComponentConfig(<IComponentConstructor> ComponentReporterManager)).to.deep.equal({
      metrics: {
        interval: 60 * 1000
      }
    });
  });

  it('should startAtAllProcesses() / stopAtAllProcesses() be ok', () => {

    const ctx: any = {
      metricsManager: new EventEmitter,
      traceManager: new EventEmitter,
      errorLogManager: new EventEmitter,
      config: {
        metrics: {
          interval: 60 * 1000
        }
      }
    };

    const componentReporterManager = new ComponentReporterManager(ctx);
    componentReporterManager.startAtAllProcesses();
    componentReporterManager.stopAtAllProcesses();

  });

  it('should start() and startAtSupervisor() as alias of startAtAllProcesses()', async () => {

    let calledTimes = 0;
    const fakeComponentReporterManager: ComponentReporterManager = <any> {
      start: ComponentReporterManager.prototype.start,
      startAtSupervisor: ComponentReporterManager.prototype.startAtSupervisor,
      startAtAllProcesses() {
        calledTimes++;
      }
    };
    await fakeComponentReporterManager.start();
    expect(calledTimes).to.be.equal(1);
    await fakeComponentReporterManager.startAtSupervisor();
    expect(calledTimes).to.be.equal(2);

  });

  it('should stop() and stopAtSupervisor() as alias of stopAtAllProcesses()', async () => {

    let calledTimes = 0;
    const fakeComponentReporterManager: ComponentReporterManager = <any> {
      stop: ComponentReporterManager.prototype.stop,
      stopAtSupervisor: ComponentReporterManager.prototype.stopAtSupervisor,
      stopAtAllProcesses() {
        calledTimes++;
      }
    };
    await fakeComponentReporterManager.stop();
    expect(calledTimes).to.be.equal(1);
    await fakeComponentReporterManager.stopAtSupervisor();
    expect(calledTimes).to.be.equal(2);

  });

  it('should bindOscillators() dispatch to ReporterManager be ok', async() => {
    let lastGot = null;
    const ctx: any = {
      metricsManager: new EventEmitter,
      traceManager: new EventEmitter,
      errorLogManager: new EventEmitter,
      config: {
        metrics: {
          interval: 60 * 1000
        }
      }
    };
    const componentReporterManager = new ComponentReporterManager(ctx);
    componentReporterManager.reporterManager = <any> {
      async dispatch (type, data) {
        lastGot = [type, data];
      }
    };

    const expected1 = ['test1'];
    componentReporterManager.metricsOscillator.emit('oscillate', expected1);
    expect(lastGot).to.deep.equal(['metrics', expected1]);


    const expected2 = ['test2'];
    componentReporterManager.traceOscillator.emit('oscillate', expected2);
    expect(lastGot).to.deep.equal(['trace', expected2]);

    const expected3 = ['test3'];
    componentReporterManager.errorLogOscillator.emit('oscillate', expected3);
    expect(lastGot).to.deep.equal(['errorLog', expected3]);

  });

});
