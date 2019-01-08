import { Tracer, REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } from 'opentracing';
import { EventEmitter } from 'events';
import { inherits } from 'util';
import { PandoraSpan } from './PandoraSpan';
import { SpanOptions } from './domain';
import { SPAN_CREATED } from './constants';
import { PandoraCodec } from './codec/PandoraCodec';
import { PandoraHttpCodec } from './codec/PandoraHttpCodec';
import { PandoraSpanContext } from './PandoraSpanContext';
import { PandoraReference } from './PandoraReference';
import { getRandom64 } from './utils';

export class PandoraTracer extends Tracer {

  private _codec: Map<string, PandoraCodec> = new Map();

  constructor() {
    super();
    EventEmitter.call(this);

    this.registerCodec('http', new PandoraHttpCodec());
  }

  registerCodec(name: string, codec: PandoraCodec): void {
    this._codec.set(name, codec);
  }

  getCodec(name: string): PandoraCodec {
    return this._codec.get(name);
  }

  extract(format: string, carrier: any): PandoraSpanContext {
    const codec = this.getCodec(format);

    return codec.extract(carrier);
  }

  inject(spanContext: PandoraSpanContext, format: string, carrier: any): void {
    const codec = this.getCodec(format);

    return codec.inject(spanContext, carrier);
  }

  startSpan(operationName: string, options: SpanOptions): PandoraSpan {
    const childOf = options.childOf;
    let references = options.references || [];
    let userTags = options.tags || {};
    let startTime = options.startTime || Date.now();

    let followsFromIsParent = false;
    let parent: PandoraSpanContext = childOf && (childOf instanceof PandoraSpan ? childOf.context() : childOf);

    // 如果 references 存在且 parent 未指定时，
    // 则 parent 为 references 的 referencedContext。
    for (let i = 0; i < references.length; i++) {
      let ref: PandoraReference = references[i];
      if (ref.type() === REFERENCE_CHILD_OF) {
        if (!parent || followsFromIsParent) {
          parent = ref.referencedContext();
          break;
        }
      } else if (ref.type() === REFERENCE_FOLLOWS_FROM) {
        if (!parent) {
          parent = ref.referencedContext();
          followsFromIsParent = true;
        }
      }
    }

    const childCtx = this.createChildContext(parent);
    const span = new PandoraSpan(this, operationName, childCtx, startTime);

    span.addTags(userTags);
    (<any>this).emit(SPAN_CREATED, span);
    return span;
  }

  createChildContext(parent: PandoraSpanContext): PandoraSpanContext {
    if (!parent) {
      return new PandoraSpanContext();
    }

    const traceId = parent.traceId || getRandom64();

    const childCtx = new PandoraSpanContext({
      traceId,
      baggage: parent.baggage,
      spanId: getRandom64(),
      parentId: parent.spanId,
      traceName: parent.traceName
    });

    return childCtx;
  }
}

inherits(PandoraTracer, EventEmitter);