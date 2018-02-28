import { IPatcher } from '../domain';
import { hook } from 'module-hook';
import * as shimmer from './Shimmer';
import { TraceManager } from './TraceManager';
import * as assert from 'assert';
import { EnvironmentUtil, Environment } from 'pandora-env';
const debug = require('debug')('PandoraMetrics:Trace:Patcher');

export class Patcher implements IPatcher {

  hookStore = {};
  options;
  env: Environment = EnvironmentUtil.getInstance().getCurrentEnvironment();
  appName = this.getAppName();
  plugins = new Map();

  constructor(options) {
    this.options = options || {};

    if (this.options.plugins && Array.isArray(this.options.plugins)) {
      this.options.plugins.forEach((plugin) => {
        this.use(plugin);
      });

      this.applyPlugins();
    }
  }

  hook(version: string, reply: (loadModule, replaceSource?, version?) => void) {
    this.hookStore[version] = reply;
  }

  use(plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  applyPlugins() {
    for (let [name, plugin] of this.plugins.entries()) {
      if (plugin.enabled) {
        plugin.target(this, plugin.initConfig || {});
        debug(`Patcher ${this.getModuleName()} load plugin ${name}.`);
      }
    }
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
