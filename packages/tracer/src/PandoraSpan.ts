import { Span } from 'opentracing';
import { EventEmitter } from 'events';
import { inherits } from 'util';
import { PandoraSpanContext } from './PandoraSpanContext';
import { PandoraTracer } from './PandoraTracer';
import { PandoraReference } from './PandoraReference';
import { convertObjectToArray, mapToObj } from './utils';
import { SPAN_FINISHED } from './constants';
import { Tag, LogData } from './domain';

export class PandoraSpan extends Span {
  private __tracer: PandoraTracer;
  private _spanContext: PandoraSpanContext;
  private _operationName: string;
  private _startTime: number;
  private _duration: number;
  private _finishTime: number;
  private _tags: Map<string, Tag>;
  private _logs: LogData[];
  private _references: PandoraReference[];

  constructor(
    tracer: PandoraTracer,
    operationName: string,
    spanContext: PandoraSpanContext,
    startTime: number
  ) {
    super();
    EventEmitter.call(this);

    this.__tracer = tracer;
    this._operationName = operationName;
    this._spanContext = spanContext;
    this._startTime = startTime;
    this._duration = 0;
    this._finishTime = 0;
    this._tags = new Map();
    this._logs = [];
    this._references = [];
  }

  get operationName(): string {
    return this._operationName;
  }

  get duration(): number {
    return this._duration;
  }

  get references(): PandoraReference[] {
    return this._references;
  }

  get startTime(): number {
    return this._startTime;
  }

  get logs(): LogData[] {
    return this._logs;
  }

  get tags(): Map<string, Tag> {
    return this._tags;
  }

  get traceId(): string {
    return this.context().traceId;
  }

  get traceName(): string {
    return this.context().traceName || this._operationName;
  }

  get isEntry(): boolean {
    return this.tag('is_entry') || false;
  }

  tracer(): PandoraTracer {
    return this.__tracer;
  }

  context(): PandoraSpanContext {
    return this._spanContext;
  }

  setBaggageItem(key: string, value: any): this {
    this._spanContext.setBaggageItem(key, value);

    return this;
  }

  getBaggageItem(key: string): any {
    return this._spanContext.getBaggageItem(key);
  }

  removeBaggageItem(key: string) {
    this._spanContext.removeBaggageItem(key);
  }

  setOperationName(operationName: string): this {
    this._operationName = operationName;

    return this;
  }

  setTag(key: string, value: any): this {
    this._tags.set(key, value);

    return this;
  }

  addTags(keyValuePairs: {[key: string]: any}): this {
    for (const key in keyValuePairs) {
      if (keyValuePairs.hasOwnProperty(key)) {
        const value = keyValuePairs[key];
        this.setTag(key, value);
      }
    }

    return this;
  }

  tag(key: string): any {
    if (this._tags.has(key)) {
      return this._tags.get(key);
    } else {
      return null;
    }
  }

  log(keyValuePairs: {[key: string]: string}, timestamp?: number): this {
    this._logs.push({
      timestamp: timestamp || Date.now(),
      fields: convertObjectToArray(keyValuePairs),
    });

    return this;
  }

  logEvent(eventName: string, payload: any): this {
    return this.log({
      event: eventName,
      payload: payload,
    });
  }

  error(isError: boolean): this {
    return this.setTag('error', isError);
  }

  finish(finishTime?: number): void {
    this._finishTime = finishTime || Date.now();
    this._duration = this._finishTime - this._startTime;

    (<any>this).emit(SPAN_FINISHED, this);
  }

  toJSON(): any {
    const tags = mapToObj(this.tags);

    return {
      name: this.operationName,
      timestamp: this.startTime,
      duration: this.duration,
      context: this.context(),
      references: this._references.map((reference) => {
        return (<PandoraSpanContext> reference.referencedContext()).toJSON();
      }),
      tags,
      logs: this.logs
    };
  }
}

inherits(PandoraSpan, EventEmitter);