import { Patcher } from '../Patcher';
import { MySQLWrapper } from './wrappers/mysql/MySQLWrapper';
import { MySQLPatcherOptions } from '../domain';

export class MySQLPatcher extends Patcher {
  protected options: MySQLPatcherOptions;
  protected _moduleName = 'MySQL';
  protected wrapper: MySQLWrapper;

  target() {
    return 'mysql';
  }

  version() {
    return '^2.x';
  }

  attach() {
    const target = this.target();
    const version = this.version();
    const hook = this.hook;

    hook(target, version, (loadModule) => {
      const mysql = loadModule('./index.js');
      const self = this;

      this.wrapper.wrapFactory(mysql, 'createConnection', function wrapCreateConnection(connection) {
        if (self.wrapper.wrapQueriable(connection, false)) {
          self.shimmer.unwrap(mysql, 'createConnection');
        }
      });

      // 底层调用的还是 connection.query，但回调在 pool.query 上处理方便
      this.wrapper.wrapFactory(mysql, 'createPool', function wrapCreatePool(pool) {
        if (self.wrapper.wrapQueriable(pool, true)) {
          self.shimmer.unwrap(mysql, 'createPool');
        }
      });

      // 底层调用的还是 connection.query，请求时会出现 Query 实例参数
      this.wrapper.wrapFactory(mysql, 'createPoolCluster', function wrapCreatePoolCluster(poolCluster) {
        if (self.wrapper.wrapGetConnection(poolCluster)) {
          self.shimmer.unwrap(mysql, 'createPoolCluster');
        }
      });
    });
  }

  unattach() {}
}