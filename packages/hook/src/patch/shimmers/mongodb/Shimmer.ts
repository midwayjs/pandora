/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as assert from 'assert';
import { INSTANCE_UNKNOWN } from '../../../utils/Constants';
import * as is from 'is-type-of';
import { normalizeInfo } from '../../../utils/Database';
const debug = require('debug')('PandoraHook:Mongodb:Shimmer');

export class MongodbShimmer {

  options = {
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
   * 注入 modules，由 mongodb apm 提供
   * @param {Error} error - 错误信息
   * @param {Array} instrumentations - 可注入的模块
   */
  instrumentModules = (error, instrumentations) =>  {
    if (error) {
      debug('instrumentModules error. ', error);
      return;
    }

    instrumentations.forEach(this.instrumentModule);
  }

  /**
   * 注入 module，处理每个大模块下的子方法
   * @param {Object} module - 模块信息
   */
  instrumentModule = (module) => {
    const object = module.obj;
    const instrumentations = module.instrumentations;

    debug('instrument module ', module.name);

    for (let i = 0; i < instrumentations.length; i++) {
      this.applyInstrumentation(module.name, object, instrumentations[i]);
    }
  }

  /**
   * 执行模块注入
   * @param {String} objectName - 模块名称
   * @param {Object} object - 模块实例
   * @param {Object} instrumentation - 注入的方法
   */
  applyInstrumentation(objectName, object, instrumentation) {
    const methods = instrumentation.methods;
    const methodOptions = instrumentation.options;

    // 可以判断是否为异步方法，mongodb 内部会给出类似 {callback: true, promise: true} 描述
    // callback 为 true 时，promise 不一定为 true
    if (methodOptions.callback) {
      for (let j = 0; j < methods.length; j++) {
        let method = methods[j];

        let isQuery = this.queryDesc[objectName].isQuery;
        let extractQueryFunc = this.queryDesc[objectName].extractQuery;
        let proto = object.prototype;

        if (is.nullOrUndefined(isQuery)) {
          debug('No wrapping method found for %s', objectName);
        } else {
          this.wrapQuery(proto, method, extractQueryFunc(method, methodOptions), isQuery);
        }
      }
    }

    if (/Cursor$/.test(objectName)) {
      this.wrapQuery(object.prototype, 'pipe');
    }
  }

  buildTags(invokeInfo, isQuery, parsedQuery) {
    const tags = {};

    if (isQuery) {
      tags['mongodb.method'] = {
        value: parsedQuery.operation || invokeInfo.query,
        type: 'string'
      };

      tags['mongodb.host'] = {
        type: 'string',
        value: invokeInfo.instanceAttr.host
      };
      tags['mongodb.portPath'] = {
        type: 'string',
        value: String(invokeInfo.instanceAttr.portPath)
      };
      tags['mongodb.database'] = {
        type: 'string',
        value: invokeInfo.instanceAttr.databaseName
      };
      tags['mongodb.collection'] = {
        type: 'string',
        value: parsedQuery.collection
      };
    } else {
      tags['mongodb.method'] = {
        value: invokeInfo.name,
        type: 'string'
      };
    }

    // 透传 invokeInfo，但最后不输出 tag
    tags['invokeInfo'] = {
      callback: invokeInfo.callback,
      promise: invokeInfo.promise,
      callbackIdx: invokeInfo.callbackIdx
    };

    return tags;
  }

  wrapQuery(module, method, extractInvoke?, isQuery?) {
    const self = this;

    return this._wrapQuery(module, method, function queryTagsBuilder(ctx, args) {
      let invokeInfo = is.function(extractInvoke) ? extractInvoke(ctx, args) : extractInvoke || {};

      if (isQuery) {
        if (invokeInfo.instanceAttr) {
          invokeInfo.instanceAttr = normalizeInfo(invokeInfo.instanceAttr);
        }
      }
      let parsedQuery = {};
      if (invokeInfo.query) {
        parsedQuery = self.parseQuery(ctx, invokeInfo.query);
      }

      return self.buildTags(invokeInfo, isQuery, parsedQuery);
    });
  }

  parseQuery(ctx, query) {
    return this.mongoQueryParser(ctx, query);
  }

  protected _createSpan(tracer, currentSpan) {
    const traceId = tracer.traceId;

    return tracer.startSpan('mongodb', {
      childOf: currentSpan,
      traceId
    });
  }

  protected _finish(span) {}

  wrapCallback(callback, span, tracer) {
    const self = this;
    const traceManager = this.traceManager;
    callback = traceManager.bind(callback);

    let _callback = function wrapQueryCallback(error, value1, value2) {
      tracer.setCurrentSpan(span);

      span.error(!!error);

      span.finish();
      self._finish(span);

      return value2 ? callback(error, value1, value2) :  callback(error, value1);
    };

    return traceManager.bind(_callback);
  }

  protected _wrapQuery(module, method, tagsBuilder) {
    const self = this;
    const traceManager = self.traceManager;

    return this.shimmer.wrap(module, method, function queryWrapper(query) {
      return function wrappedQuery(this: any) {
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

        const span = self._createSpan(tracer, currentSpan);

        if (!span) {
          debug('Create new span empty, skip trace');
          return query.apply(this, args);
        }

        span.addTags(tags);
        let callbackSkip = false;
        if (invokeInfo.callback) {
          const callbackIdx = invokeInfo.callbackIdx;
          let callback = args[args.length + callbackIdx];

          if (callback && is.function(callback)) {
            callback = self.wrapCallback(callback, span, tracer);
            args[args.length + callbackIdx] = callback;
          } else {
            callbackSkip = true;
            debug('query callback null, won\'t wrap callback.', args);
          }
        }

        let ret;

        try {
          ret = query.apply(this, args);
        } finally {
          if (callbackSkip && invokeInfo.callback && !invokeInfo.promise) {
            tracer.setCurrentSpan(span);
            span.error(false);
            span.finish();
            self._finish(span);
          }
        }

        if (ret) {
          if (invokeInfo.promise && is.promise(ret)) {

            return ret.then((result) => {
              tracer.setCurrentSpan(span);
              span.error(false);

              span.finish();
              self._finish(span);

              return result;
            }).catch((error) => {
              tracer.setCurrentSpan(span);
              span.error(true);

              span.finish();
              self._finish(span);

              throw error;
            });
          }
        }

        return ret;
      };
    });
  }

  mongoQueryParser(ctx, operation) {
    let collection = ctx.collectionName || INSTANCE_UNKNOWN;
    if (ctx.collection && ctx.collection.collectionName) {
      collection = ctx.collection.collectionName;
    } else if (ctx.s && ctx.s.name) {
      collection = ctx.s.name;
    } else if (ctx.ns) {
      collection = ctx.ns.split(/\./)[1] || collection;
    }

    return {
      operation: operation,
      collection: collection
    };
  }

  getInstanceAttr(ctx) {
    const innerState = ctx.s;
    let databaseName, serverOptions;

    databaseName = innerState.databaseName || innerState.dbName || null;

    if (innerState.topology) {
      serverOptions = innerState.topology.s && innerState.topology.s.options;
    } else if (innerState.db && innerState.db.serverConfig) {
      serverOptions = innerState.db.serverConfig;
    }

    if (serverOptions) {
      return this._getInstanceAttr(serverOptions, databaseName);
    }

    debug('Can not find instance attr.');

    return {
      host: INSTANCE_UNKNOWN,
      portPath: null,
      databaseName: INSTANCE_UNKNOWN
    };
  }

  _getInstanceAttr(conf, database) {
    let host = conf.host;
    let port = conf.port;

    // using domain socket
    if (conf.socketOptions && conf.socketOptions.domainSocket) {
      port = host;
      host = 'localhost';
    }

    return {
      host: host,
      portPath: port,
      databaseName: database
    };
  }

  extractQueryFactory = (methodName, methodOptions = {
    callback: false,
    promise: false
  }) => {
    const self = this;

    return function extractQuery(ctx) {
      const instanceAttr = self.getInstanceAttr(ctx);
      const callbackIdx = -1;

      return {
        query: methodName,
        callback: methodOptions.callback,
        promise: methodOptions.promise,
        callbackIdx,
        instanceAttr
      };
    };
  }

  get queryDesc() {

    return {
      'Gridstore': {
        isQuery: false,
        extractQuery: function gridQueryExtract(opName, methodOptions = {
          callback: false,
          promise: false
        }) {
          return {
            name: 'GridFS-' + opName,
            callbackIdx: -1,
            callback: methodOptions.callback,
            promise: methodOptions.promise
          };
        }
      },
      'OrderedBulkOperation': {
        isQuery: true,
        extractQuery: this.extractQueryFactory
      },
      'UnorderedBulkOperation': {
        isQuery: true,
        extractQuery: this.extractQueryFactory
      },
      'CommandCursor': {
        isQuery: true,
        extractQuery: this.extractQueryFactory
      },
      'AggregationCursor': {
        isQuery: true,
        extractQuery: this.extractQueryFactory
      },
      'Cursor': {
        isQuery: true,
        extractQuery: this.extractQueryFactory
      },
      'Collection': {
        isQuery: true,
        extractQuery: this.extractQueryFactory
      },
      'Db': {
        isQuery: false,
        extractQuery: function dbQueryExtract(opName, methodOptions = {
          callback: false,
          promise: false
        }) {
          return {
            name: 'DB-' + opName,
            callbackIdx: -1,
            callback: methodOptions.callback,
            promise: methodOptions.promise
          };
        }
      }
    };
  }
}
