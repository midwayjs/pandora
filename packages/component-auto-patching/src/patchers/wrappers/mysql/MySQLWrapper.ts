import { MySQLPatcherOptions } from '../../../domain';
import * as shimmer from '../../../Shimmer';
import { Wrapper } from '../Wrapper';
import { CURRENT_CONTEXT, INSTANCE_UNKNOWN, HOST_UNKNOWN, TABLE_UNKNOWN } from '../../../constants';
import { Connection, PoolCluster } from 'mysql';
import { IPandoraSpan } from 'pandora-component-trace';
import { getDatabaseConfigFromQuery, isLocalhost, recordError } from '../../../utils';
import * as is from 'is-type-of';
import * as os from 'os';
import * as Parser from './SqlParser';

export class MySQLWrapper extends Wrapper {
  options: MySQLPatcherOptions;
  tagPrefix: string = 'mysql';

  wrapFactory(target: any, property: string, wrapper: Function) {

    const self = this;

    shimmer.wrap(target, property, function wrapFactory(original: any, name: string) {
      self.logger.info(`[MySQLWrapper] wrap factory function ${name}`);

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
  wrapQueriable(queriable: any, isPoolQuery: boolean) {
    if (!queriable || !queriable.query || queriable.__wrapped) {
      return false;
    }

    const prototype = Object.getPrototypeOf(queriable);

    this.wrapQuery(prototype, isPoolQuery);

    return true;
  }

  wrapQuery(module: any, isPoolQuery: boolean) {
    return this._wrapQuery(module, isPoolQuery);
  }

  _wrapQuery(module: any, isPoolQuery: boolean) {
    const self = this;

    return shimmer.wrap(module, 'query', function queryWrapper(query) {

      return function wrappedQuery(this: Connection, sql, values, cb) {
        const args = self.argsNormalize(sql, values, cb);
        const _instanceInfo = self.getInstanceInfo(this, args.options);
        const instanceInfo = self.normalizeInfo(_instanceInfo);
        const sqlInfo = self.parseQuery(args.options);
        const tags = self.buildTags(instanceInfo, sqlInfo, isPoolQuery);
        const span = self.createSpan(tags);

        if (!span) {
          self.logger.info('[MySQLWrapper] create span return null, skip trace.');
          return query.apply(this, arguments);
        }

        const callback = args.cb;

        if (!callback) {
          self.logger.info('[MySQLWrapper] query callback null, ignore trace.', args);
          return query.apply(this, arguments);
        }

        const options = self.transformArgs(args.options, span);
        self.recordSql(span, options);
        const bindCallback = self.bindCallback(callback, span);

        return query.apply(this, [options, bindCallback]);
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

    shimmer.wrap(proto, '_getConnection', function getConnectionWrapper(origin) {

      return function wrappedGetConnection(this: PoolCluster) {
        // 一般 callback 在最后一个，其实就一个参数
        const args = Array.from(arguments);
        const callbackIndex = args.length - 1;
        const callback = args[callbackIndex];

        /* istanbul ignore next */
        if (is.function(callback) && !callback.__wrapped) {
          args[callbackIndex] = function _callback(error, connection) {
            try {
              /* istanbul ignore next */
              if (!error) {
                self.wrapQueriable(connection, true);
              }
            } catch (error) {
              self.logger.info('[MySQLWrapper] Wrap PoolConnection#query failed. ', error);
            }

            return callback.apply(this, arguments);
          };
        }

        return origin.apply(this, args);
      };
    });

    return true;
  }

  bindCallback(callback, span: IPandoraSpan) {
    const self = this;
    callback = this.cls.bind(callback);

    const _callback = function wrappedQueryCallback(error, results, fields) {
      span.error(!!error);
      recordError(span, error, self.recordErrorDetail);
      span.finish();
      return callback(error, results, fields);
    };

    return this.cls.bind(_callback);
  }

  transformArgs(args, span: IPandoraSpan) { return args; }

  recordSql(span: IPandoraSpan, options) {
    if (this.options.recordSql) {
      span.log({
        sql: options.sql
      });
    }
  }

  buildTags(instanceInfo, sqlInfo, isPoolQuery) {
    const tags = {};

    tags[`${this.tagPrefix}.method`] = isPoolQuery ? 'pool#query' : 'query';

    tags[`${this.tagPrefix}.host`] = instanceInfo.host;
    tags[`${this.tagPrefix}.portPath`] = instanceInfo.portPath;
    tags[`${this.tagPrefix}.database`] = instanceInfo.databaseName;

    /* istanbul ignore next */
    if (sqlInfo) {
      tags[`${this.tagPrefix}.table`] = sqlInfo.collection || TABLE_UNKNOWN;
      tags[`${this.tagPrefix}.operation`] = sqlInfo.operation;
    }

    return tags;
  }

  createSpan(tags): IPandoraSpan {
    const tracer = this.tracer;

    if (!tracer) {
      this.logger.info('[MySQLWrapper] no tracer, skip trace.');
      return null;
    }

    const context = this.cls.get(CURRENT_CONTEXT);

    if (!context) {
      this.logger.info('[MySQLWrapper] no current context, skip trace.');
      return null;
    }

    tags.is_entry = false;

    const span = tracer.startSpan(this.moduleName, {
      childOf: context,
      tags,
      startTime: Date.now()
    });

    return span;
  }

  argsNormalize(sql, values, cb) {
    let _options: any = {};
    let _cb = cb && typeof cb === 'function' ? cb : null;

    if (typeof sql === 'function') {
      _cb = sql;
    }

    if (typeof sql === 'object') {
      for (const prop in sql) {
        _options[prop] = sql[prop];
      }

      if (typeof values === 'function') {
        _cb = values;
      } else if (values !== undefined) {
        _options.values = values;
      }

      // pool cluster query use one args `Query`
      if(!_cb && _options._callback) {
        _cb = _options._callback;
      }

      return {
        options: _options,
        cb: _cb
      };
    }

    _options.sql = sql;
    _options.values = values;

    if (typeof values === 'function') {
      _cb = values;
      _options.values = undefined;
    }

    if (_cb === null && cb !== undefined) {
      this.logger.info('[MySQLWrapper] argument callback must be a function when provided');
    }

    return {
      options: _options,
      cb: _cb
    };
  }

  getInstanceInfo(queriable, options) {
    const info = {
      host: null,
      portPath: null,
      databaseName: null
    };

    let conf = queriable.config;
    conf = (conf && conf.connectionConfig) || conf;

    if (conf) {
      info.databaseName = conf.database;

      if (Object.hasOwnProperty.call(conf, 'socketPath') && conf.socketPath) {
        // unix domain socket host force to be localhost
        info.host = 'localhost';
        info.portPath = conf.socketPath;
      } else {
        info.host = conf.host;
        info.portPath = conf.port;
      }
    } else {
      this.logger.info('No query config, just try to get database name from query');
      info.databaseName = getDatabaseConfigFromQuery(options.sql);
    }

    return info;
  }

  normalizeInfo = (info) => {
    info = info || {};
    const options = this.options;

    if (!options.recordDatabaseName) {
      delete info.databaseName;
    } else if (
      Object.hasOwnProperty.call(info, 'databaseName') &&
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
      /* istanbul ignore next */
      if (Object.hasOwnProperty.call(info, 'portPath')) {
        info.portPath = String(info.portPath || INSTANCE_UNKNOWN);
      }

      /* istanbul ignore next */
      if (Object.hasOwnProperty.call(info, 'host')) {
        /* istanbul ignore next */
        if (info.host && isLocalhost(info.host)) {
          info.host = os.hostname();
        }

        if (!info.host) {
          info.host = HOST_UNKNOWN;
        }
      }
    }

    return info;
  }

  /**
   * 解析 sql
   */
  parseQuery(options) {
    let parsed = {
      operation: null,
      collection: null,
      query: ''
    };

    try {
      parsed = Parser.parseSql(options);
    } catch (error) {
      this.logger.info(`parse sql error, origin options is ${JSON.stringify(options)}. `, error);

      return {
        operation: INSTANCE_UNKNOWN,
        collection: INSTANCE_UNKNOWN,
        sql: options.sql
      };
    }

    let collection = parsed.collection;
    // strip enclosing special characters from collection (table) name
    /* istanbul ignore next */
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

  unwrap(target: any): void {}
}