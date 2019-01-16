import {ComponentReflector, componentName, componentConfig, dependencies} from '../src/ComponentReflector';
import {expect} from 'chai';
describe('ComponentReflector', function () {
  it('should decorating componentName be ok', () => {
    const expectName = 'expectName';
    @componentName(expectName)
    class TestClass {
    }
    expect(ComponentReflector.getComponentName(TestClass)).to.be.equal(expectName);
  });
  it('should decorating componentConfig be ok', () => {
    const expectConfig = {a: 1};
    @componentConfig(expectConfig)
    class TestClass {
    }
    expect(ComponentReflector.getComponentConfig(TestClass)).to.be.equal(expectConfig);
  });
  it('should decorating dependencies be ok', () => {
    const expectDependencies = ['1', '2', '3'];
    @dependencies(expectDependencies)
    class TestClass {
    }
    expect(ComponentReflector.getDependencies(TestClass)).to.be.equal(expectDependencies);
  });
});
