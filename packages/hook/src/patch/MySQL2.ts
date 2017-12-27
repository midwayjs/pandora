/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { MySQLPatcher } from './MySQL';

export class MySQL2Patcher extends MySQLPatcher {
  getModuleName() {
    return 'mysql2';
  }

  getModuleVersion() {
    return '^1.5';
  }
}