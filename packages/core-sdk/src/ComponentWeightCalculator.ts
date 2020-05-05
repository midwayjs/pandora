import {IComponentDeclaration} from './types';
import * as assert from 'assert';

export interface ISortedItem {
  name: string;
  weight: number;
}

export class ComponentWeightCalculator {

  private components: Map<string, IComponentDeclaration>;

  constructor(components: Map<string, IComponentDeclaration>) {
    this.components = components;
  }

  getWeight(name, chain?: string[]) {
    chain = Array.from(chain || []);
    assert(-1 === chain.indexOf(name), `Component name: ${name} in a cyclic dependency chain: ${chain.join(' -> ')} -> ${name}`);
    if(chain.length > 1 && name === 'all') {
      throw new Error(`Reserved component name 'all' not allowed to contains within a dependency chain: ${chain.join(' -> ')} -> ${name}`);
    }
    if(name === 'all') {
      return Infinity;
    }
    chain.push(name);
    assert(this.components.has(name), `Could not found component, name: ${name}`);
    const componentDeclaration = this.components.get(name);
    if (!componentDeclaration.dependencies || !componentDeclaration.dependencies.length) {
      return 1;
    } else {
      const nextLevelWeights = [];
      for (const nextName of componentDeclaration.dependencies) {
        nextLevelWeights.push(this.getWeight(nextName, chain));
      }
      return Math.max.apply(Math, nextLevelWeights) + 1;
    }
  }

  getSortedComponentNames(order: 'asc' | 'desc'): ISortedItem[] {
    const ret = [];
    for (const name of this.components.keys()) {
      ret.push({name, weight: this.getWeight(name)});
    }
    return ret.sort((a, b) => {
      if (order === 'asc') {
        return a.weight - b.weight;
      } else {
        return b.weight - a.weight;
      }
    });
  }

}
