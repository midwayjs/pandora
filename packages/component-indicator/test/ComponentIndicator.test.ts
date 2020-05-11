import { expect } from 'chai';
import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import ComponentIndicator from '../src/ComponentIndicator';

describe('ComponentIndicator', () => {
  it('should have correct meta info', () => {
    expect(
      ComponentReflector.getComponentName(
        ComponentIndicator as IComponentConstructor
      )
    ).to.be.equal('indicator');
    expect(
      ComponentReflector.getDependencies(
        ComponentIndicator as IComponentConstructor
      )
    ).to.deep.equal(['ipcHub']);
  });

  it('should publish indicatorManager at all start entries be ok', async () => {
    const ctx = {};
    const componentIndicator: ComponentIndicator = new ComponentIndicator(ctx);
    let publishCalledTimes = 0;
    componentIndicator.indicatorManager = {
      publish() {
        publishCalledTimes++;
      },
    } as any;
    await componentIndicator.startAtSupervisor();
    expect(publishCalledTimes).to.be.equal(1);
    await componentIndicator.start();
    expect(publishCalledTimes).to.be.equal(2);
  });

  it('should publish() can avoid error', async () => {
    const ctx = {};
    const componentIndicator: ComponentIndicator = new ComponentIndicator(ctx);
    componentIndicator.indicatorManager = {
      publish() {
        throw new Error('test Error');
      },
    } as any;
    await componentIndicator.publish();
  });
});
