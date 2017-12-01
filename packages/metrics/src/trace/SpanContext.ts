export default class SpanContext {
  _traceId;
  _spanId;
  _parentId;

  private custom: Map<string, string | number> = new Map();

  constructor(ctx: {
    traceId?: string,
    spanId?: string,
    parentId?: string
  } = {}) {
    const { traceId, spanId, parentId, ...rest} = ctx;
    this._traceId = traceId;
    this._spanId = spanId;
    this._parentId = parentId;

    this.initCustomContext(rest);
  }

  initCustomContext(context) {
    Object.keys(context).forEach((key) => {
      const value = context[key];
      if (typeof value === 'string' || typeof value === 'number') {
        this.setCustomContext(key, context[key]);
      }
    });
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

  setCustomContext(key, value) {
    this.custom.set(key, value);
  }

  getCustomContext(key) {
    return this.custom.get(key);
  }

  toJSON() {
    const result = {
      traceId: this.traceId,
      parentId: this.parentId,
      spanId: this.spanId
    };

    for (let [key, value] of this.custom.entries()) {
      if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }
}