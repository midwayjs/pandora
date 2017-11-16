'use strict';
import {Span as OpenTraceSpan} from 'opentracing';
const uuid = require('uuid');

export class PandoraSpan extends OpenTraceSpan {

  __tracer;
  uuid = this._generateUUID();
  startMs = Date.now();
  finishMs = 0;
  operationName = '';
  tags = {};
  logs = [];
  startStack;
  _spanContext;

  constructor(tracer, spanContext) {
    super();
    this.__tracer = tracer;
    spanContext.spanId = this.uuid;
    this._spanContext = spanContext;
  }

  _setOperationName(name) {
    this.operationName = name;
  }

  _generateUUID() {
    return uuid();
  }

  _addTags(set) {
    const keys = Object.keys(set);
    for (const key of keys) {
      this.tags[key] = set[key];
    }
  }

  _log(fields, timestamp) {
    this.logs.push({
      fields,
      timestamp: timestamp || Date.now()
    });
  }

  _finish(finishTime) {
    finishTime = finishTime || Date.now();
    this.finishMs = finishTime;
  }

  addReference(ref) {
    this._spanContext.parentId = ref.referencedContext().spanId;
  }

  tracer() {
    return this.__tracer;
  }

  context() {
    return this._spanContext;
  }

  /**
   * Returns a simplified object better for console.log()'ing.
   */
  debug() {
    return {
      uuid: this.uuid,
      operation: this.operationName,
      millis: [this.finishMs - this.startMs, this.startMs, this.finishMs],
      tags: this.tags,
      logs: this.logs,
    };
  }
}
