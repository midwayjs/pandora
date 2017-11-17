'use strict';
import {Tracer as OpenTrancer} from 'opentracing';
import {PandoraSpan} from './PandoraSpan';
import SpanContext from './SpanContext';

const EventEmitter = require('super-event-emitter');
const CURRENT_SPAN = 'CURRENT_SPAN';

export class Tracer extends OpenTrancer {

  options;
  spans = [];
  namespace;

  constructor(options: { ns? } = {}) {
    super();
    EventEmitter.mixin(this);
    this.options = options;
    this.namespace = options.ns;
  }

  protected _startSpan(name: string, fields) {

    // allocSpan is given it's own method so that derived classes can
    // allocate any type of object they want, but not have to duplicate
    // the other common logic in startSpan().
    const span = this._allocSpan(new SpanContext(fields.ctx));
    span.setOperationName(name);
    this.spans.push(span);

    if (fields.references) {
      for (let i = 0; i < fields.references.length; i++) {
        span.addReference(fields.references[i]);
      }
    }

    // Capture the stack at the time the span started
    span.startStack = new Error().stack;
    if (this.namespace) {
      this.namespace.set(CURRENT_SPAN, span);
    }
    return span;
  }

  getCurrentSpan() {
    if (this.namespace) {
      return this.namespace.get(CURRENT_SPAN);
    }
  }

  private _allocSpan(ctx) {
    return new PandoraSpan(this, ctx);
  }

  finish() {
    (<any>this).emit('finish', this);
  }

  report() {
    return this;
  }

}
