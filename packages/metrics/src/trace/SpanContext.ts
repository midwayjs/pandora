export default class SpanContext {
  _traceId;
  _spanId;
  _parentId;
  _rpcId;

  constructor(ctx: {
    traceId?: string,
    spanId?: string,
    rpcId?: string,
    parentId?: string
  } = {}) {
    this._traceId = ctx.traceId;
    this._spanId = ctx.spanId;
    this._rpcId = ctx.rpcId;
    this._parentId = ctx.parentId;
  }

  get traceId() {
    return this._traceId;
  }

  get spanId() {
    return this._spanId;
  }

  get rpcId() {
    return this._rpcId;
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

  set rpcId(rpcId) {
    this._rpcId = rpcId;
  }

  set parentId(parentId) {
    this._parentId = parentId;
  }

  toString() {
    return [
      this.traceId,
      this.rpcId,
      this.spanId,
      this.parentId || '0'
    ].join(':');
  }
}