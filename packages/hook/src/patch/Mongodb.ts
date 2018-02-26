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

    this.hook('^3.x', (loadModule) => {
      const mongodb = loadModule('./index');

      if (mongodb.instrument) {
        console.log('run this1');
        const mongodbShimmer = new MongodbShimmer(shimmer, traceManager, options);
        console.log('run this2');
        mongodb.instrument({}, mongodbShimmer.instrumentModules);

        // console.log('run this3');
        // 认为 startd 在 span 创建后，检查 span 里信息是否正确
        // instrumenter.on('started', function onMongoEventStarted(event) {
        //   const connId = event.connectionId;
        //   console.log('event: ', event);
        //   if (connId) {
        //     // Mongo sticks the path to the domain socket in the "host" slot, but we
        //     // want it in the "port", so if we have a domain socket we need to change
        //     // the order of our parameters.
        //     if (connId.domainSocket) {
        //       mongodbShimmer.captureInstanceAttributes('localhost', connId.host, event.databaseName);
        //     } else {
        //       mongodbShimmer.captureInstanceAttributes(connId.host, connId.port, event.databaseName);
        //     }
        //   }
        // });
      }

      return;
    });
  }
}