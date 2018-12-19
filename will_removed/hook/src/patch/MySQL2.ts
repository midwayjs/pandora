import { MySQLPatcher } from './MySQL';

export class MySQL2Patcher extends MySQLPatcher {
  getModuleName() {
    return 'mysql2';
  }

  getModuleVersion() {
    return '^1.5';
  }
}