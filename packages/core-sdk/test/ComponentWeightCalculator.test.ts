import {expect} from 'chai';
import {IComponentDeclaration} from '../src/domain';
import {ComponentWeightCalculator} from '../src/ComponentWeightCalculator';
describe('ComponentWeightCalculator', function () {

  const sa: IComponentDeclaration = {
    name: 'testA',
    path: 'testA',
    dependencies: ['testB', 'testC']
  };
  const sb: IComponentDeclaration = {
    name: 'testB',
    path: 'testB',
    dependencies: ['testC']
  };
  const sc: IComponentDeclaration = {
    name: 'testC',
    path: 'testC',
    dependencies: ['testD']
  };
  const sd: IComponentDeclaration = {
    name: 'testD',
    path: 'testD',
    dependencies: []
  };

  it('should getWeight() be ok', async () => {

    const components: Map<string, IComponentDeclaration> = new Map;
    components.set(sa.name, sa);
    components.set(sb.name, sb);
    components.set(sc.name, sc);
    components.set(sd.name, sd);
    const calculator = new ComponentWeightCalculator(components);

    expect(calculator.getWeight(sa.name)).equal(4);
    expect(calculator.getWeight(sb.name)).equal(3);
    expect(calculator.getWeight(sc.name)).equal(2);
    expect(calculator.getWeight(sd.name)).equal(1);

  });

  it('should getSortedComponentNames() be ok', async () => {

    const components: Map<string, IComponentDeclaration> = new Map;
    components.set(sa.name, sa);
    components.set(sb.name, sb);
    components.set(sc.name, sc);
    components.set(sd.name, sd);
    const calculator = new ComponentWeightCalculator(components);

    expect(calculator.getSortedComponentNames('asc')).to.deep.equal([
      {name: 'testD', weight: 1},
      {name: 'testC', weight: 2},
      {name: 'testB', weight: 3},
      {name: 'testA', weight: 4}
    ]);
    expect(calculator.getSortedComponentNames('desc')).to.deep.equal([
      {name: 'testA', weight: 4},
      {name: 'testB', weight: 3},
      {name: 'testC', weight: 2},
      {name: 'testD', weight: 1}
    ]);

  });


});
