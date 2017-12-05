'use strict';
const clsBluebird = require('cls-bluebird');
import { Patcher } from 'pandora-metrics';

export class BluebirdPatcher extends Patcher {

  constructor() {
    super();

    this.shimmer();
  }

  getModuleName() {
    return 'bluebird';
  }

  shimmer() {
    const traceManager = this.getTraceManager();

    this.hook('3.x', (loadModule) => {
      const pkg = loadModule('package.json');
      const Promise = loadModule(pkg.main);
      // wrap 后丢失了 addYieldHandler 方法，需要加回来，待 PR 合并后去除
      // see: https://github.com/TimBeyer/cls-bluebird/pull/17
      const addYieldHandler = Promise.coroutine.addYieldHandler;
      clsBluebird(traceManager.ns, Promise);
      Promise.coroutine.addYieldHandler = addYieldHandler;
    });
  }
}
