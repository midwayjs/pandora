/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as assert from 'assert';
import { INSTANCE_UNKNOWN } from '../../../utils/Constants';
import * as is from 'is-type-of';
import * as os from 'os';
import { isLocalhost, hasOwn } from '../../../utils/Utils';
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
   * 注入 modules，有 mongodb apm 提供
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
      console.log('wrap: ', objectName, methods, methodOptions);
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

    // the cursor object implements Readable stream and internally calls nextObject on
    // each read, in which case we do not want to record each nextObject() call
    if (objectName === 'Cursor') {
      this.wrapQuery(object.prototype, 'pipe');
    }
  }

  buildTags(invokeInfo, isQuery, parsedQuery) {
    const tags = {};

    if (isQuery) {
      tags['mongodb.method'] = {
        value: invokeInfo.query,
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
          invokeInfo.instanceAttr = self.normalizeInfo(invokeInfo.instanceAttr);
        }
      }
      let parsedQuery = {};
      if (invokeInfo.query) {
        parsedQuery = self.parseQuery(invokeInfo.query);
      }

      return self.buildTags(invokeInfo, isQuery, parsedQuery);
    });
  }

  parseQuery(query) {
    return this.mongoQueryParser(query);
  }

  protected _createSpan(tracer, currentSpan) {
    const traceId = tracer.traceId;

    return tracer.startSpan('mongodb', {
      childOf: currentSpan,
      traceId
    });
  }

  protected _finish(span) {}

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

        if (invokeInfo.callback) {
          const callbackIdx = invokeInfo.callbackIdx;
          const callback = args[args.length + callbackIdx];

          if (!callback) {
            debug('query callback null, won\'t wrap callback.', args);
          } else {
            // wrapCallback
          }
        }

        const ret = query.apply(this, args);

        if (ret) {
          if (invokeInfo.promise && is.promise(ret)) {
            // wrapPromise
          }
        }

        return ret;

        // ret && ret.then && ret.then((data) => {
        //   console.log('aaaa: ', arguments);
        //   tracer.setCurrentSpan(span);
        //   span.error(false);
        //
        //   span.finish();
        //   self._finish(span);
        //
        //   return data;
        // }).catch((error) => {
        //   tracer.setCurrentSpan(span);
        //   span.error(true);
        //
        //   span.finish();
        //   self._finish(span);
        //
        //   throw error;
        // });
        //
        // console.log('====> ret: ', ret);
        //
        // return ret;

        // callback = traceManager.bind(callback);
        //
        // let _callback = function wrappedQueryCallback(error, results, fields) {
        //   tracer.setCurrentSpan(span);
        //
        //   span.error(!!error);
        //
        //   span.finish();
        //   self._finish(span);
        //
        //   return callback(error, results, fields);
        // };

        // _callback = traceManager.bind(_callback);

        // if (callbackIdx === -1) {
        //   // 调用参数为 Query 实例的情况，只有一个参数
        //   args[0]._callback = _callback;
        // } else {
        //   args[callbackIdx] = _callback;
        // }
      };
    });
  }

  mongoQueryParser(this: any, operation) {
    let collection = this.collectionName || INSTANCE_UNKNOWN;
    if (this.collection && this.collection.collectionName) {
      collection = this.collection.collectionName;
    } else if (this.s && this.s.name) {
      collection = this.s.name;
    } else if (this.ns) {
      collection = this.ns.split(/\./)[1] || collection;
    }

    return {
      operation: operation,
      collection: collection
    };
  }

  getInstanceAttr(ctx) {
    if (ctx.db && ctx.db.serverConfig) {
      const databaseName = (
        ctx.db.serverConfig.db ||
        ctx.db.serverConfig.dbInstance ||
        { databaseName: null }
      ).databaseName;

      return this._getInstanceAttr(ctx.db.serverConfig, databaseName);
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

  captureInstanceAttributes(this: any, host, port, database) {
    const tracer = this.traceManager.getCurrentTracer();

    if (!tracer) {
      debug('No available tracer, skip.');
      return;
    }

    const currentSpan = tracer.getCurrentSpan();

    if (!currentSpan) {
      debug('No current span was found, skip.');
      return;
    }

    const params = this.normalizeInfo({
      host: host,
      portPath: port,
      databaseName: database
    });

    return params;
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

        if (!info.host) {
          info.host = INSTANCE_UNKNOWN;
        }
      }
    }

    return info;
  }
}