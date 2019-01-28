import { expect } from 'chai';
import { ComponentReflector } from 'pandora-component-decorator';
import ComponentAutoPatching from '../src/ComponentAutoPatching';

describe('ComponentAutoPatching', function () {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(ComponentAutoPatching)).to.be.equal('autoPatching');
    expect(ComponentReflector.getComponentConfig<any>(ComponentAutoPatching).trace).to.be.ok;
    expect(ComponentReflector.getComponentConfig<any>(ComponentAutoPatching).autoPatching).to.be.ok;
  });

  it('should work without pathcers config', () => {
    const autoPatching = new ComponentAutoPatching({
      config: {
        autoPatching: {}
      }
    });

    expect(autoPatching).to.be.exist;
  });
});