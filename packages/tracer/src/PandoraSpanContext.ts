import { SpanContext } from 'opentracing';
import { getRandom64 } from './utils';
import { Baggage, ContextOptions } from './domain';

export class PandoraSpanContext extends SpanContext {
  private _traceId: string;
  private _baggage: Baggage;
  private _parentId: string;
  private _spanId: string;
  private _traceName: string;

  constructor(options: ContextOptions = {}) {
    super();

    this._traceId = options.traceId;
    this._baggage = options.baggage || new Map();
    this._spanId = options.spanId;
    this._parentId = options.parentId;
    this._traceName = options.traceName;
  }

  get traceId(): string {
    if (!this._traceId) {
        this._traceId = getRandom64();
    }

    return this._traceId;
  }

  set traceId(traceId: string) {
    this._traceId = traceId;
  }

  get traceName(): string {
    return this._traceName;
  }

  set traceName(traceName: string) {
    this._traceName = traceName;
  }

  get spanId(): string {
    return this._spanId;
  }

  get parentId(): string {
    return this._parentId;
  }

  get baggage(): Baggage {
    return this._baggage;
  }

  set baggage(baggage: Baggage) {
    this._baggage = baggage;
  }

  setBaggageItem(key: string, value: any) {
    this._baggage.set(key, value);
  }

  getBaggageItem(key: string): any {
    return this._baggage.get(key);
  }

  removeBaggageItem(key: string) {
    this._baggage.delete(key);
  }

  toJSON() {
    const result = {
      traceId: this.traceId,
      parentId: this.parentId,
      spanId: this.spanId
    };

    for (const [key, value] of this.baggage.entries()) {
      if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }
}