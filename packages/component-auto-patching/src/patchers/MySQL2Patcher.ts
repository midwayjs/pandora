import { MySQLPatcher } from './MySQLPatcher';

export class MySQL2Patcher extends MySQLPatcher {
  protected _moduleName = 'mySQL2';

  target() {
    return 'mysql2';
  }

  version() {
    return '^1.5';
  }
}