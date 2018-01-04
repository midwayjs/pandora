import {IPatcher} from '../domain';
import { hook } from 'module-hook';
import * as shimmer from './Shimmer';
import {TraceManager} from './TraceManager';
const assert = require('assert');
import {EnvironmentUtil, Environment} from 'pandora-env';

export class Patcher implements IPatcher {

  hookStore = {};
  options;
  env: Environment = EnvironmentUtil.getInstance().getCurrentEnvironment();
  appName = this.getAppName();

  constructor(options = {}) {
    this.options = options;
  }

  hook(version: string, reply: (loadModule, replaceSource?, version?) => void) {
    this.hookStore[version] = reply;
  }

  getShimmer() {
    return shimmer;
  }

  run() {
    for(let version in this.hookStore) {
      this.getHook()(this.getModuleName(), version, this.hookStore[version]);
    }
  }

  getHook() {
    return hook;
  }

  getModuleName() {
    assert('please overwrite getModuleName() method before hook module!');
  }

  getTraceManager() {
    return TraceManager.getInstance();
  }

  getAppName() {
    return this.env.get('appName');
  }

}
