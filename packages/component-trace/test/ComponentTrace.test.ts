import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentTrace from '../src/ComponentTrace';
import {TraceManager} from '../src/TraceManager';

describe('ComponentTrace', () => {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentTrace)).to.be.equal('trace');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentTrace)).to.deep.equal(['indicator']);
    expect(ComponentReflector.getComponentConfig(<IComponentConstructor> ComponentTrace)).to.deep.equal({
      trace: {
        poolSize: 100,
        interval: 60 * 1000,
        slowThreshold: 10 * 1000
      }
    });
  });

  it('should start and stop at supervisor mode be ok', async () => {
    const componentTrace: ComponentTrace = new ComponentTrace({
      config: {
        trace: {}
      }
    });
    expect(componentTrace.traceManager).to.be.an.instanceof(TraceManager);
    let calledStart = false;
    let calledStop = false;
    const traceManager: TraceManager = <any> {
      start () {
        calledStart = true;
      },
      stop() {
        calledStop = true;
      }
    };
    componentTrace.traceManager = traceManager;
    await componentTrace.startAtSupervisor();
    expect(calledStart).to.be.equal(true);
    await componentTrace.stopAtSupervisor();
    expect(calledStop).to.be.equal(true);
  });

  it('should start and stop at worker mode be ok', async () => {
    const componentTrace: ComponentTrace = new ComponentTrace({
      config: { }
    });
    expect(componentTrace.traceManager).to.be.an.instanceof(TraceManager);
    let calledStart = false;
    let calledStop = false;
    const traceManager: TraceManager = <any> {
      start () {
        calledStart = true;
      },
      stop() {
        calledStop = true;
      }
    };
    componentTrace.traceManager = traceManager;
    await componentTrace.start();
    expect(calledStart).to.be.equal(true);
    await componentTrace.stop();
    expect(calledStop).to.be.equal(true);
  });

});