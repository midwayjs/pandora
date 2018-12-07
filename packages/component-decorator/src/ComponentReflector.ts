import 'reflect-metadata';
import {IComponentConstructor} from './domain';

export class ComponentReflector {
  static COMPONENT_NAME = 'COMPONENT_NAME';
  static COMPONENT_DEPENDENCIES = 'COMPONENT_DEPENDENCIES';
  static getDependencies(klass: IComponentConstructor): string[] {
    return Reflect.getMetadata(ComponentReflector.COMPONENT_DEPENDENCIES, klass);
  }
  static getComponentName(klass: IComponentConstructor): string {
    return Reflect.getMetadata(ComponentReflector.COMPONENT_NAME, klass);
  }
}

export function dependencies(deps: string[]) {
  return function (target: any): void {
    Reflect.defineMetadata(ComponentReflector.COMPONENT_DEPENDENCIES, deps, target);
  };
}

export function componentName(name: string) {
  return function (target: any): void {
    Reflect.defineMetadata(ComponentReflector.COMPONENT_NAME, name, target);
  };
}
