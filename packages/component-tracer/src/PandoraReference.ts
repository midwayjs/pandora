import { Reference } from 'opentracing';
import { PandoraSpanContext } from './PandoraSpanContext';

export class PandoraReference extends Reference {
  protected _type: string;
  protected _referencedContext: PandoraSpanContext;

  type(): string {
    return this._type;
  }

  referencedContext(): PandoraSpanContext {
    return this._referencedContext;
  }

  constructor(type: string, referencedContext: PandoraSpanContext) {
    super(type, referencedContext);
    this._type = type;
    this._referencedContext = referencedContext;
  }
}