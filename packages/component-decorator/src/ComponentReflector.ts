import 'reflect-metadata';
import {IComponentConstructor} from './types';

export class ComponentReflector {
  static COMPONENT_NAME = 'COMPONENT_NAME';
  static COMPONENT_DEPENDENCIES = 'COMPONENT_DEPENDENCIES';
  static COMPONENT_CONFIG = 'COMPONENT_CONFIG';
  static getDependencies(klass: IComponentConstructor): string[] {
    return Reflect.getMetadata(ComponentReflector.COMPONENT_DEPENDENCIES, klass);
  }
  static getComponentName(klass: IComponentConstructor): string {
    return Reflect.getMetadata(ComponentReflector.COMPONENT_NAME, klass);
  }
  static getComponentConfig<T extends any>(klass: IComponentConstructor): T {
    return Reflect.getMetadata(ComponentReflector.COMPONENT_CONFIG, klass);
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

export function componentConfig<T extends any>(config: T) {
  return function (target: any): void {
    Reflect.defineMetadata(ComponentReflector.COMPONENT_CONFIG, config, target);
  };
}
