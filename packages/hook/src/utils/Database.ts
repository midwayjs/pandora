import { hasOwn, isLocalhost } from './Utils';
import { INSTANCE_UNKNOWN } from './Constants';
import * as os from 'os';
import * as is from 'is-type-of';

/**
 * 规范实例信息，主要是根据参数过滤以及处理空值
 * @param {object} info - 实例信息
 * @param {object} options - 参数配置
 *   @property {boolean} recordDatabaseName - 是否记录数据库名称
 *   @property {boolean} recordInstance - 是否记录数据库实例信息
 * @returns {object}
 */
export function normalizeInfo(info, options = {
  recordDatabaseName: true,
  recordInstance: true
}) {
  info = info || {};

  if (!options.recordDatabaseName) {
    delete info.databaseName;
  } else if (
    hasOwn(info, 'databaseName') &&
    info.databaseName !== false
  ) {
    info.databaseName = is.number(info.databaseName)
      ? String(info.databaseName)
      : (info.databaseName || INSTANCE_UNKNOWN);
  }

  if (!options.recordInstance) {
    delete info.host;
    delete info.portPath;
  } else {
    if (hasOwn(info, 'portPath')) {
      info.portPath = String(info.portPath || INSTANCE_UNKNOWN);
    }

    if (hasOwn(info, 'host')) {
      if (info.host && isLocalhost(info.host)) {
        info.host = os.hostname();
      }

      if (!info.host) {
        info.host = INSTANCE_UNKNOWN;
      }
    }
  }

  return info;
}