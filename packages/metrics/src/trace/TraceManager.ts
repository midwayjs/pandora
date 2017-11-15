'use strict';
const createNamespace = require('./cls').createNamespace;
const TRACEID = 'traceId';
const uuid = require('uuid');
import {Tracer} from './Tracer';

export class TraceManager {

  traceContainer = {};
  ns = createNamespace('pandora_tracer');
  finished = {};

  constructor() {
    const contexts = this.ns._contexts;
    // 半分钟清除一次已经完成的trace, 避免内存泄漏
    if (contexts) {
      setInterval(() => {
        const finished = this.finished;
        this.finished = {};

        // 超过 30s 未完成，放弃
        for (let id in this.traceContainer) {
          const trace = this.traceContainer[id];
          const isTimeout = Date.now() - trace.date > 30 * 1000;
          if (isTimeout) {
            this.traceContainer[id] = null;
            delete this.traceContainer[id];
          }
        }

        for (let key of contexts.keys()) {
          const item = contexts.get(key);
          if (!item || finished[item.traceId]) {
            contexts.delete(key);
          }
        }
      }, 30 * 1000);
    }
  }

  getCurrentTracer() {
    const traceId = this.ns.get(TRACEID);
    if (traceId) {
      return this.traceContainer[traceId];
    }
  }

  getTracer(traceId) {
    return this.traceContainer[traceId];
  }

  create(options) {
    options.traceId = options.traceId || uuid();
    const traceId = options.traceId;
    this.ns.set(TRACEID, traceId);
    const tracer = new Tracer(options);
    this.traceContainer[traceId] = tracer;
    (<any>tracer).once('finish', () => {
      this.removeTracer(traceId);
    });
    return tracer;
  }

  removeTracer(traceId) {
    if (this.traceContainer[traceId]) {
      this.finished[traceId] = 1;
      this.traceContainer[traceId] = null;
      delete this.traceContainer[traceId];
    }
  }

  bind(fn, context) {
    return this.ns.bind(fn, context);
  }

  run(fn, context) {
    return this.ns.run(fn, context);
  }

  bindEmitter(emitter) {
    return this.ns.bindEmitter(emitter);
  }

}
