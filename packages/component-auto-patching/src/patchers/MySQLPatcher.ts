import { Connection, Query, Pool } from 'mysql';
import { IPandoraSpan } from 'pandora-component-trace';
import * as is from 'is-type-of';
import * as os from 'os';
import { Patcher } from '../Patcher';
import { MySQLPatcherOptions } from '../domain';
import { CURRENT_CONTEXT, INSTANCE_UNKNOWN, HOST_UNKNOWN, TABLE_UNKNOWN } from '../constants';
import { recordError, getDatabaseConfigFromQuery, setInternalProperty, isLocalhost } from '../utils';
import * as Parser from './SqlParser';

export class MySQLPatcher extends Patcher {
  protected options: MySQLPatcherOptions;
  protected _moduleName = 'mysql';
  protected unwrappers = [];
  protected _tagPrefix = 'mysql';

  get shouldRecordSql() {
    return this.options.recordSql !== undefined ? this.options.recordSql : true;
  }

  get ConnectionPath() {
    return 'lib/Connection.js';
  }

  get PoolPath() {
    return 'lib/Pool.js';
  }

  target() {
    return 'mysql';
  }

  version() {
    return '^2.x';
  }

  createSpan(): IPandoraSpan {
    const tracer = this.tracer;

    if (!tracer) {
      this.logger.info('[MySQLPatcher] no tracer, skip trace.');
      return null;
    }

    const context = this.cls.get(CURRENT_CONTEXT);

    if (!context) {
      this.logger.info('[MySQLPatcher] no current context, skip trace.');
      return null;
    }

    const span = tracer.startSpan(this.spanName, {
      childOf: context,
      tags: {
        is_entry: false
      },
      startTime: Date.now()
    });

    span.error(false);

    return span;
  }

  recordQueryInfo(span: IPandoraSpan, query: Query, error: Error) {
    span.setTag(this.tagName('method'), 'query');
    this.recordTable(span, query);
    this.recordConnectionInfo(span, query);
    this.recordSql(span, query);
    span.error(!!error);
    recordError(span, error, this.recordErrorDetail);
  }

  recordTable(span: IPandoraSpan, query: Query) {
    const sql = query.sql;
    let parsedSql;
    let operation = INSTANCE_UNKNOWN;
    let collection = TABLE_UNKNOWN;

    try {
      parsedSql = Parser.parseSql(sql);

      operation = parsedSql.operation;
      collection = parsedSql.collection;
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
    } catch (error) {
      this.logger.info(`parse sql error, origin sql is ${sql}. `, error);
    }

    span.setTag(this.tagName('operation'), operation);
    span.setTag(this.tagName('table'), collection);
  }

  recordSql(span: IPandoraSpan, query: Query) {
    if (this.shouldRecordSql) {
      let sql = query.sql;
      const values = query.values;
      const sqlMask = this.options.sqlMask;

      if (sqlMask && is.function(sqlMask)) {
        sql = sqlMask(sql);
      }

      span.log({ sql });

      if (values) {
        span.log({ values });
      }
    }
  }

  recordConnectionInfo(span: IPandoraSpan, query: Query) {
    const sql = query.sql;
    const connection = query._connection;

    if (connection) {
      const config = connection.config;
      const database = config.database || getDatabaseConfigFromQuery(sql) || INSTANCE_UNKNOWN;
      let host = config.host || HOST_UNKNOWN;
      let portPath = config.port || INSTANCE_UNKNOWN;

      if (Object.hasOwnProperty.call(config, 'socketPath') && config.socketPath) {
        host = 'localhost';
        portPath = config.socketPath;
      }

      if (host && isLocalhost(host)) {
        host = os.hostname();
      }

      span.setTag(this.tagName('host'), host);
      span.setTag(this.tagName('portPath'), portPath);
      span.setTag(this.tagName('database'), database);
    } else {
      this.logger.info('[MySQLPatcher] query without connection info.');
    }
  }

  wrapCallback(span: IPandoraSpan, query: Query): Function {
    const self = this;
    const callback = this.cls.bind(query._callback);

    const _callback = function wrappedQueryCallback(error, results, fields) {
      self.recordQueryInfo(span, query, error);
      span.finish();

      return callback(error, results, fields);
    };

    return this.cls.bind(_callback);
  }

  transformSql(span: IPandoraSpan, query: Query): void {
    const sql = query.sql;
    let transformed = false;

    if (!sql) return;

    if (this.options.tracing) {
      transformed = this.tracing(span, query);
    }

    if (transformed) {
      span.log({ originSql: sql });
    }
  }

  tracing(span: IPandoraSpan, query: Query): boolean {
    return false;
  }

  queryTraced(query: Query) {
    setInternalProperty(query, '__pandora_traced__', true);
  }

  isQueryTraced(query: Query): boolean {
    return query && query.__pandora_traced__;
  }

  attach() {
    const target = this.target();
    const version = this.version();
    const hook = this.hook;

    hook(target, version, (loadModule) => {
      const self = this;
      const Connection = loadModule(this.ConnectionPath);
      const Pool = loadModule(this.PoolPath);

      this.logger.info(`[MySQLPatcher] patching ${target} [Connection.createQuery] and [Pool.prototype.getConnection].`);

      this.shimmer.wrap(Connection, 'createQuery', function createQueryWrapper(createQuery) {

        return function wrappedCreateQuery(this: Connection, sql, values, cb) {
          const query = createQuery.apply(this, arguments);

          // pool 会在 connection.query 前调用一次 createQuery，避免重复追踪
          if (self.isQueryTraced(query)) {
            return query;
          }

          const span = self.createSpan();

          if (!span) {
            self.logger.info('[MySQLPatcher] create span return null, skip trace.');
            return query;
          }

          self.queryTraced(query);
          self.transformSql(span, query);
          self.cls.bindEmitter(query);

          if (query._callback) {
            query._callback = self.wrapCallback(span, query);
          } else {
            query.on('end', function() {
              span.setTag('callback', false);
              span.finish();
            });
          }

          return query;
        };
      });

      this.shimmer.wrap(Pool.prototype, 'getConnection', function wrapGetConnection(getConnection) {

        return function wrappedGetConnection(this: Pool, cb) {
          const _cb = self.cls.bind(cb);

          return getConnection.call(this, _cb);
        };
      });

      this.unwrappers.push(function unwrapCreateQuery() {
        self.shimmer.unwrap(Connection, 'createQuery');
      });

      this.unwrappers.push(function unwrapGetConnection() {
        self.shimmer.unwrap(Pool.prototype, 'getConnection');
      });
    });
  }

  unattach() {
    this.unwrappers.forEach((unwrapper) => {
      unwrapper();
    });

    this.unwrappers = [];
  }
}