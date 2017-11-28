'use strict';
import { Span as OpenTraceSpan } from 'opentracing';
import { getRandom64, convertObjectToTags } from '../util/TraceUtil';

export class PandoraSpan extends OpenTraceSpan {

  __tracer;
  startMs = Date.now();
  finishMs = 0;
  duration = 0;
  tags = {};
  logs = [];
  startStack;
  operationName = '';
  _spanContext;
  _references = [];

  constructor(tracer, operationName, spanContext) {
    super();
    this.__tracer = tracer;

    if (!spanContext.spanId) {
      spanContext.spanId = getRandom64();
    }

    this._spanContext = spanContext;
    this.operationName = operationName;
  }

  setStartMs(timestamp) {
    this.startMs = timestamp;
  }

  _tracer() {
    return this.__tracer;
  }

  _context() {
    return this._spanContext;
  }

  _setOperationName(name) {
    this.operationName = name;
  }

  _addTags(tags) {
    const keys = Object.keys(tags);

    for (const key of keys) {
      this.tags[key] = tags[key];
    }
  }

  _log(fields, timestamp) {
    this.logs.push({
      fields: convertObjectToTags(fields),
      timestamp: timestamp || Date.now()
    });
  }

  _finish(finishTime) {
    finishTime = finishTime || Date.now();
    this.finishMs = finishTime;
    this.duration = finishTime - this.startMs;
  }

  addReferences(references) {
    this._references = references;
    this._context().parentId = this._references[0].referencedContext().spanId;
  }

  toJSON() {
    return {
      name: this.operationName,
      startMs: this.startMs,
      duration: this.duration,
      context: this._context().toJSON(),
      references: this._references.map((reference) => {
        return reference.referencedContext().toJSON();
      }),
      tags: this.tags,
      logs: this.logs,
      startStack: this.startStack
    };
  }
}
