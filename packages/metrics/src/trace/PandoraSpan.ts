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

  constructor(tracer) {
    super();
    this.__tracer = tracer;
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
      timestamp
    });
  }

  _finish(finishTime) {
    finishTime = finishTime || Date.now();
    this.finishMs = finishTime;
  }

  addReference(ref) {
  }

  _tracer() {
    return this.__tracer;
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
