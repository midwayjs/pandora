import {Environment} from '../domain';

export abstract class BaseEnvironment implements Environment {
  protected variables: any;
  constructor(variables?: any) {
    variables = variables || {};
    this.variables = variables;
  }
  get(key: string) {
    return this.variables[key];
  }
  set(key: string, value: any) {
    this.variables[key] = value;
  }
  abstract match(name: string): boolean;
}

