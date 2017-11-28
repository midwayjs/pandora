'use strict';
import { Tracer as OpenTrancer } from 'opentracing';
import { PandoraSpan } from './PandoraSpan';
import SpanContext from './SpanContext';

const EventEmitter = require('super-event-emitter');
const CURRENT_SPAN = 'CURRENT_SPAN';

export class Tracer extends OpenTrancer {

  options;
  spans = [];
  namespace;
  startMs = Date.now();
  finishMs = 0;
  duration = 0;

  private attrs: Map<string, any> = new Map();

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

    // Capture the stack at the time the span started
    span.startStack = new Error().stack;

    return span;
  }

  setAttr(key, value) {
    this.attrs.set(key, value);
  }

  getAttr(key) {
    return this.attrs.get(key);
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
    if (this.namespace) {
      return this.namespace.set(CURRENT_SPAN, span);
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

  report() {
    const spans = this.spans;

    return {
      traceId: this.getAttr('traceId'),
      duration: this.duration,
      spans: spans.map((span) => {
        return span.toJSON();
      })
    };
  }

}
