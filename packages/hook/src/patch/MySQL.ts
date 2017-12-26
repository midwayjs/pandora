/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { Patcher } from 'pandora-metrics';
import { MySQLShimmer } from './shimmers/mysql/Shimmer';

export class MySQLPatcher extends Patcher {

  constructor(options) {
    super(Object.assign({
      shimmerClass: MySQLShimmer
    }, options));

    this.shimmer();
  }

  getModuleName() {
    return 'mysql';
  }

  shimmer() {
    const traceManager = this.getTraceManager();
    const shimmer = this.getShimmer();
    const ShimmerClass = this.options.shimmerClass;
    const mysqlShimmer = new ShimmerClass(shimmer, traceManager, this.options);

    this.hook('^2.x', (loadModule) => {
      const mysql = loadModule('./index.js');

      mysqlShimmer.wrapFactory(mysql, 'createConnection', function wrapCreateConnection(connection) {
        if (mysqlShimmer.wrapQueriable(connection, false)) {
          shimmer.unwrap(mysql, 'createConnection');
        }
      });

      // 底层调用的还是 connection.query，但回调在 pool.query 上处理方便
      mysqlShimmer.wrapFactory(mysql, 'createPool', function wrapCreatePool(pool) {
        if (mysqlShimmer.wrapQueriable(pool, true)) {
          shimmer.unwrap(mysql, 'createPool');
        }
      });

      // 底层调用的还是 connection.query，请求时会出现 Query 实例参数
      mysqlShimmer.wrapFactory(mysql, 'createPoolCluster', function wrapCreatePoolCluster(poolCluster) {
        if (mysqlShimmer.wrapGetConnection(poolCluster)) {
          shimmer.unwrap(mysql, 'createPoolCluster');
        }
      });
    });

  }
}