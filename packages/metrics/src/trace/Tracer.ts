'use strict';
import { Tracer as OpenTrancer } from 'opentracing';
import { PandoraSpan } from './PandoraSpan';
import SpanContext from './SpanContext';
import {TraceData, TracerReport} from '../domain';

const EventEmitter = require('super-event-emitter');
const CURRENT_SPAN = 'CURRENT_SPAN';

export class Tracer extends OpenTrancer {

  options;
  spans = [];
  namespace;
  startMs = Date.now();
  finishMs = 0;
  duration = 0;

  private attrs: Map<string, TracerReport> = new Map();

  constructor(options: { ns?, traceId? } = {}) {
    super();
    EventEmitter.mixin(this);
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
    return this.attrs.get(key).getValue() || defaultValue;
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
      console.error('Set current span error.', error);
    }
  }

  private _allocSpan(operationName, spanContext) {
    return new PandoraSpan(this, operationName, spanContext);
  }

  finish() {
    this.finishMs = Date.now();
    this.duration = this.finishMs - this.startMs;

    (<any>this).emit('finish', this);
  }

  report(): TraceData {
    const spans = this.spans;

    const result = {
      timestamp: this.startMs,
      duration: this.duration,
      spans: spans.map((span) => {
        return span.toJSON();
      })
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
