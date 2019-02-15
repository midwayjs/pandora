import { MySQLPatcher } from './MySQLPatcher';

export class MySQL2Patcher extends MySQLPatcher {
  protected _moduleName = 'mysql2';
  protected _spanName = 'mysql';

  get ConnectionPath() {
    return 'lib/connection.js';
  }

  get PoolPath() {
    return 'lib/pool.js';
  }

  target() {
    return 'mysql2';
  }

  version() {
    return '^1.5';
  }
}