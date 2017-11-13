import {EnvironmentManager, Environment} from './domain';
import assert = require('assert');

const debug = require('debug')('pandora:env:EnvironmentUtil');

export class EnvironmentUtil implements EnvironmentManager {

  private static instance;
  private ready: boolean = false;

  static getInstance(): EnvironmentUtil {
    if(!this.instance) {
      this.instance = new EnvironmentUtil();
    }
    return this.instance;
  }

  private current: Environment;

  getCurrentEnvironment(): Environment {
    debug('get env');
    assert(this.current, 'should setup current environment before using it');
    return this.current;
  }

  setCurrentEnvironment(env: Environment): void {
    debug('set env');
    this.current = env;
    this.ready = true;
  }

  get(name: string) {
    assert(this.current, 'should setup current environment before using it');
    return this.current.get(name);
  }

  is(name: string) {
    assert(this.current, 'should setup current environment before using it');
    return this.current.match(name);
  }

  isReady() {
    return this.ready;
  }

}
