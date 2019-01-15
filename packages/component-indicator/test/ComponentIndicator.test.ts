import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentIndicator from '../src/ComponentIndicator';

describe('ComponentIndicator', () => {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentIndicator)).to.be.equal('indicator');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentIndicator)).to.deep.equal(['ipcHub']);
  });

  it('should publish indicatorManager at all start entries be ok', async () => {
    const ctx = {};
    const componentIndicator: ComponentIndicator = new ComponentIndicator(ctx);
    let publishCalledTimes = 0;
    componentIndicator.indicatorManager = <any> {
      publish() {
        publishCalledTimes++;
      }
    };
    await componentIndicator.startAtSupervisor();
    expect(publishCalledTimes).to.be.equal(1);
    await componentIndicator.start();
    expect(publishCalledTimes).to.be.equal(2);
  });

  it('should publish() can avoid error', async () => {
    const ctx = {};
    const componentIndicator: ComponentIndicator = new ComponentIndicator(ctx);
    componentIndicator.indicatorManager = <any> {
      publish() {
        throw new Error('test Error');
      }
    };
    await componentIndicator.publish();
  });

});
