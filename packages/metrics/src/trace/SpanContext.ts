export default class SpanContext {
  _traceId;
  _spanId;
  _parentId;

  constructor(ctx: {
    traceId?: string,
    spanId?: string,
    parentId?: string
  } = {}) {
    this._traceId = ctx.traceId;
    this._spanId = ctx.spanId;
    this._parentId = ctx.parentId;
  }

  get traceId() {
    return this._traceId;
  }

  get spanId() {
    return this._spanId;
  }

  get parentId() {
    return this._parentId;
  }

  set traceId(traceId) {
    this._traceId = traceId;
  }

  set spanId(spanId) {
    this._spanId = spanId;
  }

  set parentId(parentId) {
    this._parentId = parentId;
  }

  toJSON() {
    return {
      traceId: this.traceId,
      parentId: this.parentId,
      spanId: this.spanId
    };
  }
}