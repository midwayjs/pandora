const cls = require('./cls');
const TRACEID = 'traceId';
const uuid = require('uuid');
import { Tracer } from './Tracer';
const debug = require('debug')('Pandora:Metrics:TraceManager');
import { MessageSender } from '../util/MessageSender';
import { MessageConstants } from '../MetricsConstants';
import { TRACER_TIMEOUT } from './Constants';

export class TraceManager {

  traceContainer = {};
  ns = cls.createNamespace('pandora_tracer');
  private static instance;
  sender = new MessageSender();

  static getInstance() {
    if (!this.instance) {
      this.instance = new TraceManager();
    }
    return this.instance;
  }

  constructor() {
    this.timeoutCheck();
  }

  getTimeout() {
    return TRACER_TIMEOUT;
  }

  timeoutCheck() {
    const timeout = this.getTimeout();
    // 定时标记超时的 trace，减少内存占用
    const timer = setInterval(() => {
      for (let id in this.traceContainer) {
        const trace = this.traceContainer[id];
        const isTimeout = (Date.now() - trace.startMs) >= timeout;

        if (isTimeout) {
          trace.timeout();
        }
      }
    }, timeout);

    timer.unref();
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

  create(options: {
    traceId?,
    ns?
  } = {}) {
    try {
      options.traceId = options.traceId || uuid();
      const traceId = options.traceId;
      this.ns.set(TRACEID, traceId);
      options.ns = this.ns;
      const tracer = new Tracer(options);
      this.traceContainer[traceId] = tracer;
      (<any>tracer).once('finish', () => {
        this.report(tracer);
        this.removeTracer(traceId);
      });
      return tracer;
    } catch (error) {
      debug('create trace error.', error);
      return null;
    }
  }

  report(tracer) {
    this.sender.send(MessageConstants.TRACE, tracer.report());
  }

  removeTracer(traceId) {
    if (this.traceContainer[traceId]) {
      this.traceContainer[traceId] = null;
      delete this.traceContainer[traceId];
    }
  }

  bind(fn, context) {
    return this.ns.bind(fn, context);
  }

  run(fn, context?) {
    return this.ns.run(fn, context);
  }

  bindEmitter(emitter) {
    return this.ns.bindEmitter(emitter);
  }

}
