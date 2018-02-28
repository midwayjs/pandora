/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { Patcher } from 'pandora-metrics';
import { MongodbShimmer } from './shimmers/mongodb/Shimmer';

export class MongodbPatcher extends Patcher {

  constructor(options = {}) {
    super(options);

    this.shimmer(options);
  }

  getModuleName() {
    return 'mongodb';
  }

  shimmer(options) {
    const traceManager = this.getTraceManager();
    const shimmer = this.getShimmer();

    this.hook('>=2.2.x', (loadModule) => {
      const mongodb = loadModule('./index');

      if (mongodb.instrument) {
        const mongodbShimmer = new MongodbShimmer(shimmer, traceManager, options);
        mongodb.instrument({}, mongodbShimmer.instrumentModules);
      }

      // 暂时不考虑没有 apm 的低版本

      return;
    });
  }
}
