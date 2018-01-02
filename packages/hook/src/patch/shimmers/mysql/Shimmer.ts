/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as is from 'is-type-of';
import { isLocalhost } from '../../../utils/Utils';
import { hasOwn } from 'pandora-metrics';
import { extractDatabaseChangeFromUse } from './Utils';
import { parseSql } from './QueryParser';
import { INSTANCE_UNKNOWN, HOST_UNKNOWN, TABLE_UNKNOWN } from '../../../utils/Constants';
import * as os from 'os';
import * as assert from 'assert';
import { Connection, PoolCluster } from 'mysql';
const debug = require('debug')('PandoraHook:MySQL:Shimmer');

export class MySQLShimmer {

  options = {
    recordQuery: true,
    recordDatabaseName: true,
    recordInstance: true
  };
  shimmer = null;
  traceManager = null;

  constructor(shimmer, traceManager, options = {}) {
    assert(shimmer, 'shimmer must given');
    assert(traceManager, 'traceManager must given');

    Object.assign(this.options, options);
    this.shimmer = shimmer;
    this.traceManager = traceManager;
  }

  /**
   * 包装 factory 方法的返回值
   * @param {any} module - 模块对象
   * @param {string} property - 属性名
   * @param {function} wrapper - 包装方法
   */
  wrapFactory(module, property, wrapper) {

    this.shimmer.wrap(module, property, function wrapFactory(original, name) {
      debug(`wrap factory function ${name}`);

      function wrappedFactory(this: any) {
        const origin = original.apply(this, arguments);
        const wrapped = wrapper.call(this, origin);

        return wrapped || origin;
      }

      wrappedFactory.prototype = original.prototype;

      return wrappedFactory;
    });
  }

  /**
   * 包装 query 类对象
   * @param {object} queriable - query 对象
   * @param {boolean} isPoolQuery - 是否 pool 查询
   * @returns {boolean}
   */
  wrapQueriable(queriable, isPoolQuery) {
    if (!queriable || !queriable.query || queriable.__wrapped) {
      return false;
    }

    const prototype = Object.getPrototypeOf(queriable);

    this.wrapQuery(prototype, this.extractQuery, isPoolQuery);

    return true;
  }

  buildTags(invokeInfo, parsedQuery) {
    const tags = {};

    tags['mysql.method'] = {
      value: invokeInfo.name,
      type: 'string'
    };

    tags['mysql.host'] = {
      type: 'string',
      value: invokeInfo.host
    };
    tags['mysql.portPath'] = {
      type: 'string',
      value: String(invokeInfo.portPath)
    };
    tags['mysql.database'] = {
      type: 'string',
      value: invokeInfo.databaseName
    };

    // 透传 invokeInfo，但最后不输出 tag
    tags['invokeInfo'] = {
      callback: invokeInfo.callback,
      callbackIdx: invokeInfo.callbackIdx
    };

    if (parsedQuery) {
      tags['invokeInfo']['rawQuery'] = parsedQuery.raw;

      tags['mysql.table'] = {
        type: 'string',
        value: parsedQuery.collection || TABLE_UNKNOWN
      };

      tags['mysql.operation'] = {
        type: 'string',
        value: parsedQuery.operation
      };
    }

    return tags;
  }

  /**
   * 包装 query 方法
   * @param {object} module - 要包装的模块
   * @param {function} extractInvoke - 解析调用的方法
   * @param {boolean} isPoolQuery - 是否为 pool query
   * @returns {object}
   */
  wrapQuery(module, extractInvoke, isPoolQuery) {
    const self = this;

    return this._wrapQuery(module, function queryTagsBuilder(ctx, args) {
      let invokeInfo = extractInvoke(ctx, args, isPoolQuery);
      invokeInfo = self.normalizeInfo(invokeInfo);
      const queryStr = invokeInfo.query;
      let parsedQuery = null;

      if (queryStr) {
        parsedQuery = self.parseQuery(queryStr);
      }

      return self.buildTags(invokeInfo, parsedQuery);
    });
  }

  protected _createSpan(tracer, currentSpan) {
    const traceId = tracer.getAttrValue('traceId');

    return tracer.startSpan('mysql', {
      childOf: currentSpan,
      traceId
    });
  }

  protected _finish(span) {}

  /**
   * 包装 query 方法
   * @param {object} module - 要包装的模块
   * @param {function} tagsBuilder - 生成 tags 的方法
   * @returns {any}
   * @protected
   */
  protected _wrapQuery(module, tagsBuilder) {
    const self = this;
    const traceManager = self.traceManager;

    return this.shimmer.wrap(module, 'query', function queryWrapper(query) {
      return function wrappedQuery(this: Connection) {
        const tracer = traceManager.getCurrentTracer();

        if (!tracer) {
          debug('No current tracer, skip trace');
          return query.apply(this, arguments);
        }

        const currentSpan = tracer.getCurrentSpan();

        if (!currentSpan) {
          debug('No current span, skip trace');
          return query.apply(this, arguments);
        }

        const args = Array.from(arguments);
        const tags = tagsBuilder(this, args);

        const invokeInfo = tags.invokeInfo;
        delete tags.invokeInfo;
        let callback = invokeInfo.callback;
        const callbackIdx = invokeInfo.callbackIdx;

        // sequelize 有类似 SET time_zone = '+08:00' 这样的请求，无回调
        // 这样的请求无法跟踪结束，故放弃
        if (!callback) {
          debug('query callback null, ignore trace.', args);
          return query.apply(this, args);
        }

        const span = self._createSpan(tracer, currentSpan);

        if (!span) {
          debug('Create new span empty, skip trace');
          return query.apply(this, args);
        }

        if (self.options.recordQuery && invokeInfo.rawQuery) {
          span.log({
            query: invokeInfo.rawQuery
          });
        }

        span.addTags(tags);

        callback = traceManager.bind(callback);

        let _callback = function wrappedQueryCallback(error, results, fields) {
          tracer.setCurrentSpan(span);

          span.setTag('error', {
            type: 'bool',
            value: !!error
          });

          span.finish();
          self._finish(span);

          return callback(error, results, fields);
        };

        _callback = traceManager.bind(_callback);

        if (callbackIdx === -1) {
          // 调用参数为 Query 实例的情况，只有一个参数
          args[0]._callback = _callback;
        } else {
          args[callbackIdx] = _callback;
        }

        return query.apply(this, args);
      };
    });
  }

  /**
   * 包装 getConnection，在 cluster 中，实际调用的是 cluster 的 _getConnection
   * @param {object} connectable - 包装的对象
   * @returns {boolean}
   */
  wrapGetConnection(connectable) {
    if (
      !connectable ||
      !connectable._getConnection ||
      connectable._getConnection.__wrapped
    ) {
      return false;
    }

    const self = this;
    const proto = Object.getPrototypeOf(connectable);

    this.shimmer.wrap(proto, '_getConnection', function getConnectionWrapper(origin) {

      return function wrappedGetConnection(this: PoolCluster) {
        // 一般 callback 在最后一个，其实就一个参数
        const args = Array.from(arguments);
        const callbackIndex = args.length - 1;
        const callback = args[callbackIndex];

        if (is.function(callback) && !callback.__wrapped) {
          args[callbackIndex] = function _callback(error, connection) {
            try {
              if (!error) {
                self.wrapQueriable(connection, true);
              }
            } catch (error) {
              debug('Wrap PoolConnection#query failed. ', error);
            }

            return callback.apply(this, arguments);
          };
        }

        return origin.apply(this, args);
      };
    });

    return true;
  }

  /**
   * 解析 sql
   * @param {any} query - query
   * @returns {object}
   */
  parseQuery(query) {
    let parsed = parseSql(query);

    let collection = parsed.collection;
    // strip enclosing special characters from collection (table) name
    if (typeof collection === 'string' && collection.length > 2) {
      if (/^[\[{'"`]/.test(collection)) {
        collection = collection.substr(1);
      }
      if (/[\]}'"`]$/.test(collection)) {
        collection = collection.substr(0, collection.length - 1);
      }
    }

    return {
      operation: parsed.operation,
      collection,
      raw: parsed.query
    };
  }

  /**
   * 解构 Query 参数
   * @param {Array} args - Query 参数
   * @returns {Object}
   */
  extractQueryArgs(args) {
    let query = '';
    let callback = null;
    let idx = -1;

    // 找出 query 参数
    if (is.string(args[0])) {
      // eg: query(sql [, values], callback)
      query = args[0];
    } else {
      // eg: query(opts [, values], callback)
      query = args[0].sql;
    }

    // 找出 callback 参数
    if (is.array(args[1])) {
      // eg: query({opts|sql}, values, callback)
      callback = args[2];
      idx = 2;
    } else {
      /**
       * 参数为 Mysql.Query 的实例
       * 出现于 PoolNamespace query 重试时
       */
      if (is.object(args[0])) {
        callback = args[0]._callback;
      } else {
        // eg: query({opts|sql}, callback)
        callback = args[1];
        idx = 1;
      }
    }

    return {
      query: query,
      callback: callback,
      callbackIdx: idx
    };
  }

  /**
   * 结构化 query 查询
   * @param {object} ctx - queryable 实例
   * @param {any} args - 参数
   * @param {boolean} isPoolQuery - 是否为 pool query
   * @returns {object}
   */
  extractQuery = (ctx, args, isPoolQuery) => {
    const extractedArgs = this.extractQueryArgs(args);
    const info = this.getInstanceInfo(ctx, extractedArgs.query);

    return Object.assign(info, {
      query: extractedArgs.query,
      callback: extractedArgs.callback,
      callbackIdx: extractedArgs.callbackIdx,
      name: isPoolQuery ? 'pool#query' : 'query'
    });
  }

  /**
   * 获取 mysql 实例信息
   * @param {any} queryable - query 实例
   * @param {object} query - 查询参数
   * @returns {object}
   */
  getInstanceInfo(queryable, query) {
    const info = {
      host: null,
      portPath: null,
      databaseName: null
    };

    let conf = queryable.config;
    conf = (conf && conf.connectionConfig) || conf;

    if (conf) {
      info.databaseName = conf.database;

      if (hasOwn(conf, 'socketPath') && conf.socketPath) {
        // unix domain socket host force to be localhost
        info.host = 'localhost';
        info.portPath = conf.socketPath;
      } else {
        info.host = conf.host;
        info.portPath = conf.port;
      }
    } else {
      debug('No query config, just try to get database name from query');
      info.databaseName = extractDatabaseChangeFromUse(query);
    }

    return info;
  }

  /**
   * 规范实例信息，主要是根据参数过滤以及处理空值
   * @param {object} info - 实例信息
   * @returns {object}
   */
  protected normalizeInfo = (info) => {
    info = info || {};
    const options = this.options;

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

        if (!info.host || info.host === HOST_UNKNOWN) {
          info.host = INSTANCE_UNKNOWN;
        }
      }
    }

    return info;
  }
}