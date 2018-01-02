'use strict';
import { Tracer as OpenTrancer } from 'opentracing';
import { PandoraSpan } from './PandoraSpan';
import SpanContext from './SpanContext';
import { TraceData, TracerReport } from '../domain';
import { NORMAL_TRACE, CURRENT_SPAN, TIMEOUT_TRACE, SLOW_TRACE, ERROR_TRACE } from './Constants';

const debug = require('debug')('Pandora:Metrics:Tracer');
const EventEmitter = require('events');
const mixin = require('mixin');

export class Tracer extends (mixin(OpenTrancer, EventEmitter) as { new(): any }) {

  options;
  spans = [];
  namespace;
  startMs = Date.now();
  finishMs = 0;
  duration = 0;
  status = NORMAL_TRACE;
  _finished = false;

  private attrs: Map<string, TracerReport> = new Map();

  constructor(options: { ns?, traceId? } = {}) {
    super();
    this.options = options;
    this.namespace = options.ns;
    this.setAttr('traceId', options.traceId);
  }

  protected _startSpan(name: string, fields) {
    // allocSpan is given it's own method so that derived classes can
    // allocate any type of object they want, but not have to duplicate
    // the other common logic in startSpan().
    const ctx = new SpanContext(fields);
    const span = this._allocSpan(name, ctx);
    this.spans.push(span);

    if (fields.references) {
      span.addReferences(fields.references);
    }

    return span;
  }

  setAttr(key, value: TracerReport | string) {
    if (typeof value === 'string') {
      this.attrs.set(key, {
        report() {
          return value;
        },
        getValue() {
          return value;
        }
      });
    } else {
      this.attrs.set(key, value);
    }

  }

  getAttr(key): TracerReport {
    return this.attrs.get(key);
  }

  getAttrValue(key, defaultValue?) {
    let ret = defaultValue;

    if (this.hasAttr(key)) {
      const item = this.attrs.get(key);
      ret = item.getValue && item.getValue() || item || defaultValue;
    } else {
      ret = defaultValue;
    }

    return ret;
  }

  hasAttr(key) {
    return this.attrs.has(key);
  }

  getCurrentSpan() {
    if (this.namespace) {
      return this.namespace.get(CURRENT_SPAN);
    }
  }

  setCurrentSpan(span) {
    try {
      if (this.namespace) {
        this.namespace.set(CURRENT_SPAN, span);
      }
    } catch (error) {
      debug('Set current span error.', error);
    }
  }

  private _allocSpan(operationName, spanContext) {
    return new PandoraSpan(this, operationName, spanContext);
  }

  finish(options = {}) {
    this.finishMs = Date.now();
    this.duration = this.finishMs - this.startMs;
    this._finished = true;

    if (options['slowThreshold']) {
      if (this.duration >= options['slowThreshold']) {
        this.setStatus(SLOW_TRACE);
      }
    }

    (<any>this).emit('finish', this);
  }

  timeout() {
    this.setStatus((SLOW_TRACE | TIMEOUT_TRACE));

    this.finish();
  }

  error() {
    this.setStatus(ERROR_TRACE);
  }

  setStatus(status) {
    if (this.status === NORMAL_TRACE) {
      status = this.status & status;
    } else {
      status = this.status | status;
    }

    this.status = status;
  }

  report(): TraceData {
    const spans = this.spans;

    const result = {
      timestamp: this.startMs,
      duration: this.duration,
      spans: spans.map((span) => {
        return span.toJSON();
      }),
      status: this.status
    };

    for (let [key, value] of this.attrs.entries()) {
      const v = value.report();

      if (v !== false) {
        result[key] = v;
      }
    }

    return result;
  }

}
