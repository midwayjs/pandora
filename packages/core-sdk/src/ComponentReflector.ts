import 'reflect-metadata';
import {IComponentConstructor} from './domain';

export class ComponentReflector {
  static COMPONENT_DEPENDENCIES = 'COMPONENT_DEPENDENCIES';
  static getDependencies(klass: IComponentConstructor): string[] {
    return Reflect.getMetadata(klass, ComponentReflector.COMPONENT_DEPENDENCIES);
  }
}